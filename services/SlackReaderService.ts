// filepath: /Users/wweber/Source/reactory/reactory-express-server/src/modules/reactory-slack/services/SlackReaderService.ts
import { service } from '@reactory/server-core/application/decorators';
import { SlackMessage, SlackMessageFilter } from '../types';

/**
 * Slack API Rate Limiting Configuration
 */
interface SlackRateLimitConfig {
  // Base delay between requests (in milliseconds)
  baseDelay: number;
  // Maximum delay between requests (in milliseconds)
  maxDelay: number;
  // Maximum number of retries for rate limited requests
  maxRetries: number;
  // Jitter factor for backoff (0-1)
  jitterFactor: number;
  // Slack API rate limits (requests per minute)
  tier1Limit: number; // Basic tier: 1 request per second
  tier2Limit: number; // Standard tier: 20 requests per minute
  tier3Limit: number; // Higher tier: 50 requests per minute
  tier4Limit: number; // Enterprise tier: 100+ requests per minute
}

/**
 * Slack Reader Service for reading messages from Slack channels
 */
@service({
  id: 'slack.SlackReaderService@1.0.0',
  description: 'Slack Reader Service for reading messages from channels',
  name: 'SlackReaderService',
  nameSpace: 'slack',
  version: '1.0.0',
  serviceType: 'data',
  dependencies: [],
})
class SlackReaderService implements Reactory.Service.IReactoryService {
  
  description: string = 'Slack Reader Service for reading messages from channels';
  tags?: string[] = ['slack', 'messaging', 'reader'];
  nameSpace: string = 'slack';
  name: string = 'SlackReaderService';
  version: string = '1.0.0';
  context: Reactory.Server.IReactoryContext;
  
  private apiToken: string;
  private baseUrl: string = 'https://slack.com/api';
  
  // Rate limiting configuration
  private rateLimitConfig: SlackRateLimitConfig = {
    baseDelay: 1000, // 1 second base delay
    maxDelay: 60000, // 1 minute maximum delay
    maxRetries: 5,   // Maximum 5 retries
    jitterFactor: 0.1, // 10% jitter
    tier1Limit: 60,  // 1 request per second
    tier2Limit: 20,  // 20 requests per minute
    tier3Limit: 50,  // 50 requests per minute
    tier4Limit: 100, // 100 requests per minute
  };
  
  // Rate limiting state
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private currentTier: number = 2; // Assume standard tier by default

  constructor(props: Reactory.Service.IReactoryServiceProps, context: Reactory.Server.IReactoryContext) {
    this.context = context;
    this.apiToken = props?.SLACK_BOT_TOKEN as string || process.env.SLACK_BOT_TOKEN || null;
    
    if (!this.apiToken) {
      this.context.warn('SlackReaderService: No Slack API token found. Set SLACK_BOT_TOKEN or SLACK_API_TOKEN environment variable.');
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateBackoffDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      // Use Slack's Retry-After header if provided
      return retryAfter * 1000;
    }
    
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = this.rateLimitConfig.baseDelay * Math.pow(2, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * this.rateLimitConfig.jitterFactor * Math.random();
    
    // Cap at maximum delay
    return Math.min(exponentialDelay + jitter, this.rateLimitConfig.maxDelay);
  }

  /**
   * Wait for the specified delay
   */
  private async wait(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Check if we need to rate limit based on current tier
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Calculate minimum delay based on current tier
    let minDelay: number;
    switch (this.currentTier) {
      case 1:
        minDelay = 1000; // 1 second
        break;
      case 2:
        minDelay = 3000; // 3 seconds (20 requests per minute)
        break;
      case 3:
        minDelay = 1200; // 1.2 seconds (50 requests per minute)
        break;
      case 4:
        minDelay = 600;  // 0.6 seconds (100 requests per minute)
        break;
      default:
        minDelay = 3000; // Default to 3 seconds
    }
    
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      this.context.debug(
        `Rate limiting: waiting ${waitTime}ms before next request`,
        {
          currentTier: this.currentTier,
          timeSinceLastRequest,
          minDelay,
          waitTime,
        },
        'SlackReaderService.checkRateLimit'
      );
      await this.wait(waitTime);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Make a rate-limited request to Slack API with retry logic
   */
  private async makeRateLimitedRequest(
    url: string,
    options: RequestInit,
    attempt: number = 0
  ): Promise<Response> {
    try {
      // Check rate limiting before making request
      await this.checkRateLimit();
      
      this.context.debug(
        `Making Slack API request (attempt ${attempt + 1})`,
        {
          url,
          attempt: attempt + 1,
          currentTier: this.currentTier,
        },
        'SlackReaderService.makeRateLimitedRequest'
      );
      
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - handle with exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
        
        if (attempt < this.rateLimitConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, retryAfterSeconds);
          
          this.context.warn(
            `Slack API rate limited (429), retrying in ${delay}ms`,
            {
              attempt: attempt + 1,
              maxRetries: this.rateLimitConfig.maxRetries,
              retryAfter: retryAfterSeconds,
              calculatedDelay: delay,
              url,
            },
            'SlackReaderService.makeRateLimitedRequest'
          );
          
          // Downgrade tier temporarily if we're getting rate limited
          this.currentTier = Math.max(1, this.currentTier - 1);
          
          await this.wait(delay);
          return this.makeRateLimitedRequest(url, options, attempt + 1);
        } else {
          throw new Error(`Slack API rate limited after ${this.rateLimitConfig.maxRetries} retries`);
        }
      }
      
      // If successful, gradually upgrade tier
      if (response.ok && this.currentTier < 4) {
        this.currentTier = Math.min(4, this.currentTier + 1);
      }
      
      return response;
    } catch (error) {
      if (attempt < this.rateLimitConfig.maxRetries && error.message.includes('rate limited')) {
        const delay = this.calculateBackoffDelay(attempt);
        
        this.context.warn(
          `Slack API error, retrying in ${delay}ms`,
          {
            attempt: attempt + 1,
            maxRetries: this.rateLimitConfig.maxRetries,
            error: error.message,
            delay,
          },
          'SlackReaderService.makeRateLimitedRequest'
        );
        
        await this.wait(delay);
        return this.makeRateLimitedRequest(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Reads messages from a Slack channel, paginating if needed to fetch all messages up to the limit.
   * @param channelId - The ID of the Slack channel
   * @param limit - Maximum number of messages to fetch (default: 100, max: 1000)
   * @param oldest - Only messages after this timestamp
   * @param latest - Only messages before this timestamp
   * @returns Promise<SlackMessage[]>
   */
  async readMessages(
    channelId: string,
    limit: number = 100,
    oldest?: string,
    latest?: string,
    filter?: SlackMessageFilter
  ): Promise<SlackMessage[]> {
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      let allMessages: SlackMessage[] = [];
      let cursor: string | undefined = undefined;
      let remaining = Math.min(limit, 1000);
      let pageCount = 0;
      
      this.context.info(
        `Starting to read messages from Slack channel ${channelId}`,
        {
          channelId,
          limit,
          oldest,
          latest,
          estimatedPages: Math.ceil(remaining / 1000),
        },
        'SlackReaderService.readMessages'
      );
      
      do {
        const pageLimit = Math.min(remaining, 1000);
        const params = new URLSearchParams({
          channel: channelId,
          limit: pageLimit.toString(),
        });
        if (oldest) params.append('oldest', oldest);
        if (latest) params.append('latest', latest);
        if (cursor) params.append('cursor', cursor);

        pageCount++;
        this.context.debug(
          `Fetching page ${pageCount} from Slack API`,
          {
            channelId,
            pageCount,
            pageLimit,
            remaining,
            cursor: cursor ? 'present' : 'none',
          },
          'SlackReaderService.readMessages'
        );

        const response = await this.makeRateLimitedRequest(
          `${this.baseUrl}/conversations.history?${params}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        const data = await response.json();

        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error}`);
        }

        const messages: SlackMessage[] = data.messages.map((message: any): SlackMessage => message as SlackMessage);
        allMessages = allMessages.concat(messages);
        remaining -= messages.length;
        
        // Check for next_cursor in response metadata
        cursor = data.response_metadata?.next_cursor;
        
        this.context.debug(
          `Page ${pageCount} completed`,
          {
            channelId,
            pageCount,
            messagesInPage: messages.length,
            totalMessagesCollected: allMessages.length,
            remaining,
            hasNextPage: !!cursor,
          },
          'SlackReaderService.readMessages'
        );
        
        // If we have enough messages, break
        if (remaining <= 0) break;
        
        // Add a small delay between pages to be respectful
        if (cursor) {
          await this.wait(100); // 100ms delay between pages
        }
      } while (cursor);
      
      // Only return up to the requested limit, after applying filter if provided
      let filteredMessages = allMessages;
      if (filter) {
        if (filter.predicate) {
          filteredMessages = filteredMessages.filter(filter.predicate);
        }
        if (filter.message) {
          filteredMessages = filteredMessages.filter(msg =>
            Object.entries(filter.message).every(
              ([key, value]) => msg[key as keyof SlackMessage] === value
            )
          );
        }
      }
      
      const finalMessages = filteredMessages.slice(0, limit);
      
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.messages.success', {
          description: 'Successful message reads',
          unit: 'operations'
        }).add(1, {
          channelId,
          messageCount: String(finalMessages.length),
          pages: String(pageCount),
          tier: String(this.currentTier),
        });
      }
      
      this.context.info(
        `Successfully read ${finalMessages.length} messages from Slack channel ${channelId}`,
        {
          channelId,
          requestedLimit: limit,
          totalPages: pageCount,
          totalMessagesCollected: allMessages.length,
          finalMessageCount: finalMessages.length,
          rateLimitTier: this.currentTier,
        },
        'SlackReaderService.readMessages'
      );
      
      return finalMessages;
    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.messages.failed', {
          description: 'Failed message reads',
          unit: 'operations'
        }).add(1, {
          channelId,
          error: error.message,
          tier: String(this.currentTier),
        });
      }
      this.context.error(
        `SlackReaderService.readMessages error: ${error.message}`,
        {
          channelId,
          limit,
          error,
          rateLimitTier: this.currentTier,
        },
        'SlackReaderService.readMessages'
      );
      throw error;
    }
  }

  /**
   * Reads replies to a threaded message
   * @param channelId - The ID of the Slack channel
   * @param threadTs - The timestamp of the parent message
   * @param limit - Maximum number of replies to fetch (default: 100)
   * @returns Promise<SlackMessage[]>
   */
  async readThreadReplies(
    channelId: string, 
    threadTs: string, 
    limit: number = 100
  ): Promise<SlackMessage[]> {
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const params = new URLSearchParams({
        channel: channelId,
        ts: threadTs,
        limit: Math.min(limit, 1000).toString(),
      });

      const response = await this.makeRateLimitedRequest(
        `${this.baseUrl}/conversations.replies?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      const messages = data.messages.map((message: any): SlackMessage => ({
        id: message.ts,
        text: message.text ?? '',
        username: message.username ?? message.bot_id ?? '',
        timestamp: message.ts,
        thread_ts: message.thread_ts,
        reply_count: message.reply_count,
        subtype: message.subtype,
        reactions: message.reactions,
        subscribed: message.subscribed,
        is_locked: message.is_locked,
        latest_reply: message.latest_reply,
        reply_users: message.reply_users,
        reply_users_count: message.reply_users_count,
        replies: message.replies,
      }));

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.threads.success', {
          description: 'Successful thread reads',
          unit: 'operations'
        }).add(1, {
          channelId,
          replyCount: String(messages.length),
          tier: String(this.currentTier),
        });
      }

      this.context.debug(
        `Successfully read ${messages.length} thread replies`,
        {
          channelId,
          threadTs,
          limit,
          actualCount: messages.length,
          rateLimitTier: this.currentTier,
        },
        'SlackReaderService.readThreadReplies'
      );

      return messages;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.threads.failed', {
          description: 'Failed thread reads',
          unit: 'operations'
        }).add(1, {
          channelId,
          error: error.message,
          tier: String(this.currentTier),
        });
      }
      this.context.error(
        `SlackReaderService.readThreadReplies error: ${error.message}`,
        {
          channelId,
          threadTs,
          error,
          rateLimitTier: this.currentTier,
        },
        'SlackReaderService.readThreadReplies'
      );
      throw error;
    }
  }

  /**
   * Gets information about a specific channel
   * @param channelId - The ID of the Slack channel
   * @returns Promise with channel information
   */
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const params = new URLSearchParams({
        channel: channelId,
      });

      const response = await this.makeRateLimitedRequest(
        `${this.baseUrl}/conversations.info?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.channelinfo.success', {
          description: 'Successful channel info requests',
          unit: 'operations'
        }).add(1, {
          channelId,
          tier: String(this.currentTier),
        });
      }

      return data.channel;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.channelinfo.failed', {
          description: 'Failed channel info requests',
          unit: 'operations'
        }).add(1, {
          channelId,
          error: error.message,
          tier: String(this.currentTier),
        });
      }
      this.context.error(
        `SlackReaderService.getChannelInfo error: ${error.message}`,
        {
          channelId,
          error,
          rateLimitTier: this.currentTier,
        },
        'SlackReaderService.getChannelInfo'
      );
      throw error;
    }
  }

  /**
   * Lists all channels the bot is a member of
   * @param types - Comma-separated list of channel types (public_channel, private_channel, mpim, im)
   * @param limit - Maximum number of channels to fetch (default: 100)
   * @returns Promise with list of channels
   */
  async listChannels(types: string = 'public_channel', limit: number = 100): Promise<any[]> {
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const params = new URLSearchParams({
        types,
        limit: Math.min(limit, 1000).toString(),
      });

      const response = await this.makeRateLimitedRequest(
        `${this.baseUrl}/conversations.list?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },      
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.listchannels.success', {
          description: 'Successful list channels requests',
          unit: 'operations'
        }).add(1, {
          types,
          count: String(data.channels?.length || 0),
          tier: String(this.currentTier),
        });
      }

      return data.channels;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.reader.listchannels.failed', {
          description: 'Failed list channels requests',
          unit: 'operations'
        }).add(1, {
          types,
          error: error.message,
          tier: String(this.currentTier),
        });
      }
      this.context.error(
        `SlackReaderService.listChannels error: ${error.message}`,
        {
          types,
          limit,
          error,
          rateLimitTier: this.currentTier,
        },
        'SlackReaderService.listChannels'
      );
      throw error;
    }
  }

  /**
   * Set the Slack API token and optionally the base URL
   * @param apiToken - The Slack API token to use for requests
   * @param baseUrl - (Optional) The base URL for the Slack API (default: https://slack.com/api)
   */
  setApiConfig(apiToken: string, baseUrl?: string): void {
    this.apiToken = apiToken;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    this.context.info('SlackWriterService: API configuration updated', { apiTokenSet: !!apiToken, baseUrl: this.baseUrl });
  }

  /**
   * Update rate limiting configuration
   * @param config - New rate limiting configuration
   */
  updateRateLimitConfig(config: Partial<SlackRateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config };
    this.context.info(
      'Rate limiting configuration updated',
      {
        newConfig: this.rateLimitConfig,
        currentTier: this.currentTier,
      },
      'SlackReaderService.updateRateLimitConfig'
    );
  }

  /**
   * Get current rate limiting statistics
   */
  getRateLimitStats(): {
    currentTier: number;
    requestCount: number;
    lastRequestTime: number;
    config: SlackRateLimitConfig;
  } {
    return {
      currentTier: this.currentTier,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      config: this.rateLimitConfig,
    };
  }

  /**
   * Reset rate limiting state (useful for testing or after errors)
   */
  resetRateLimitState(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.currentTier = 2; // Reset to standard tier
    this.context.info(
      'Rate limiting state reset',
      {
        newState: {
          requestCount: this.requestCount,
          lastRequestTime: this.lastRequestTime,
          currentTier: this.currentTier,
        },
      },
      'SlackReaderService.resetRateLimitState'
    );
  }

  async onStartup(): Promise<void> {
    this.context.info('SlackReaderService starting up...');
    
    // Test the connection if token is available
    if (this.apiToken) {
      try {
        const response = await this.makeRateLimitedRequest(
          `${this.baseUrl}/auth.test`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        
        const data = await response.json();
        if (data.ok) {
          this.context.info(`SlackReaderService connected successfully as ${data.user} in team ${data.team}`);
          
          // Determine tier based on team plan if possible
          if (data.team && data.team.plan) {
            const plan = data.team.plan.toLowerCase();
            if (plan.includes('enterprise') || plan.includes('plus')) {
              this.currentTier = 4;
            } else if (plan.includes('standard')) {
              this.currentTier = 3;
            } else {
              this.currentTier = 2; // Default to standard tier
            }
            this.context.setValue('slack.rateLimitConfig', this.rateLimitConfig, 60 * 60 * 24);
            this.context.setValue('slack.currentTier', this.currentTier, 60 * 60 * 24);
            this.context.setValue('slack.requestCount', this.requestCount, 60 * 60 * 24);
            this.context.setValue('slack.lastRequestTime', this.lastRequestTime, 60 * 60 * 24);

            this.context.info(
              `Detected Slack team plan: ${data.team.plan}, using tier ${this.currentTier}`,
              {
                plan: data.team.plan,
                tier: this.currentTier,
                rateLimit: this.rateLimitConfig,
              },
              'SlackReaderService.onStartup'
            );
          }
        } else {
          this.context.warn(`SlackReaderService connection test failed: ${data.error}`);
        }
      } catch (error) {
        this.context.warn(`SlackReaderService connection test failed: ${error.message}`);
      }
    }
    else {
      this.context.warn('SlackReaderService: No Slack API token found. Set SLACK_BOT_TOKEN or SLACK_API_TOKEN environment variable.');
    }
  }
  
  toString(includeVersion?: boolean): string {
    const versionSuffix = includeVersion ? `@${this.version}` : '';
    return `${this.nameSpace}.${this.name}${versionSuffix}`;
  }
  
  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }
  
  setExecutionContext(executionContext: Reactory.Server.IReactoryContext): void {
    this.context = executionContext;
  }
}

export default SlackReaderService;