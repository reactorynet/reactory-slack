import { service } from '@reactory/server-core/application/decorators';

/**
 * Slack Writer Service for writing messages to Slack channels
 */
@service({
  id: 'slack.SlackWriterService@1.0.0',
  description: 'Slack Writer Service for writing messages to channels',
  name: 'SlackWriterService',
  nameSpace: 'slack',
  version: '1.0.0',
  serviceType: 'data',
  dependencies: [],
})
class SlackWriterService implements Reactory.Service.IReactoryService {
  
  description: string = 'Slack Writer Service for writing messages to channels';
  tags?: string[] = ['slack', 'messaging', 'writer'];
  nameSpace: string = 'slack';
  name: string = 'SlackWriterService';
  version: string = '1.0.0';
  context: Reactory.Server.IReactoryContext;
  
  private apiToken: string;
  private baseUrl: string = 'https://slack.com/api';

  constructor(_: Reactory.Service.IReactoryServiceProps, context: Reactory.Server.IReactoryContext) {
    this.context = context;
    this.apiToken = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_API_TOKEN ?? '';
    
    if (!this.apiToken) {
      this.context.warn('SlackWriterService: No Slack API token found. Set SLACK_BOT_TOKEN or SLACK_API_TOKEN environment variable.');
    }
  }

  /**
   * Writes a message to a Slack channel
   * @param channelId - The ID of the Slack channel
   * @param message - The message content to send
   * @param threadTs - Optional timestamp of parent message for threaded reply
   * @returns Promise with success boolean and optional message metadata
   */
  async writeMessage(
    channelId: string, 
    message: string, 
    threadTs?: string
  ): Promise<{ ok: boolean; ts?: string; channel?: string; error?: string }> {
    const startTime = Date.now();
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const body = {
        channel: channelId,
        text: message,
        ...(threadTs && { thread_ts: threadTs }),
      };

      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.message.success', {
          description: 'Successful message writes',
          unit: 'messages'
        }).add(1, {
          channelId,
          isThread: String(!!threadTs),
          duration: String(Date.now() - startTime),
        });
      }

      this.context.debug(`SlackWriterService.writeMessage: Message sent successfully`, { 
        channelId, 
        messageTs: data.ts,
        threadTs 
      });

      return { ok: true, ts: data.ts, channel: data.channel };

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.message.failed', {
          description: 'Failed message writes',
          unit: 'messages'
        }).add(1, {
          channelId,
          error: error.message,
        });
      }
      this.context.error(`SlackWriterService.writeMessage error: ${error.message}`, { channelId, message, error });
      return { ok: false, error: error.message };
    }
  }

  /**
   * Updates an existing message in a Slack channel
   * @param channelId - The ID of the Slack channel
   * @param messageTs - The timestamp of the message to update
   * @param newText - The new message content
   * @returns Promise<boolean>
   */
  async updateMessage(
    channelId: string, 
    messageTs: string, 
    newText: string
  ): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const body = {
        channel: channelId,
        ts: messageTs,
        text: newText,
      };

      const response = await fetch(`${this.baseUrl}/chat.update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.update.success', {
          description: 'Successful message updates',
          unit: 'messages'
        }).add(1, {
          channelId,
          duration: String(Date.now() - startTime),
        });
      }

      this.context.debug(`SlackWriterService.updateMessage: Message updated successfully`, { 
        channelId, 
        messageTs 
      });

      return true;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.update.failed', {
          description: 'Failed message updates',
          unit: 'messages'
        }).add(1, {
          channelId,
          error: error.message,
        });
      }
      this.context.error(`SlackWriterService.updateMessage error: ${error.message}`, { channelId, messageTs, error });
      return false;
    }
  }

  /**
   * Deletes a message from a Slack channel
   * @param channelId - The ID of the Slack channel
   * @param messageTs - The timestamp of the message to delete
   * @returns Promise<boolean>
   */
  async deleteMessage(channelId: string, messageTs: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const body = {
        channel: channelId,
        ts: messageTs,
      };

      const response = await fetch(`${this.baseUrl}/chat.delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.delete.success', {
          description: 'Successful message deletions',
          unit: 'messages'
        }).add(1, {
          channelId,
          duration: String(Date.now() - startTime),
        });
      }

      this.context.debug(`SlackWriterService.deleteMessage: Message deleted successfully`, { 
        channelId, 
        messageTs 
      });

      return true;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.delete.failed', {
          description: 'Failed message deletions',
          unit: 'messages'
        }).add(1, {
          channelId,
          error: error.message,
        });
      }
      this.context.error(`SlackWriterService.deleteMessage error: ${error.message}`, { channelId, messageTs, error });
      return false;
    }
  }

  /**
   * Adds a reaction to a message
   * @param channelId - The ID of the Slack channel
   * @param messageTs - The timestamp of the message
   * @param reaction - The emoji reaction to add (without colons)
   * @returns Promise<boolean>
   */
  async addReaction(
    channelId: string, 
    messageTs: string, 
    reaction: string
  ): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const body = {
        channel: channelId,
        timestamp: messageTs,
        name: reaction,
      };

      const response = await fetch(`${this.baseUrl}/reactions.add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.reaction.success', {
          description: 'Successful reactions added',
          unit: 'reactions'
        }).add(1, {
          channelId,
          reaction,
          duration: String(Date.now() - startTime),
        });
      }

      return true;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.reaction.failed', {
          description: 'Failed reactions',
          unit: 'reactions'
        }).add(1, {
          channelId,
          error: error.message,
        });
      }
      this.context.error(`SlackWriterService.addReaction error: ${error.message}`, { channelId, messageTs, reaction, error });
      return false;
    }
  }

  /**
   * Joins a channel
   * @param channelId - The ID of the Slack channel to join
   * @returns Promise<boolean>
   */
  async joinChannel(channelId: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (!this.apiToken) {
        throw new Error('Slack API token not configured');
      }

      const body = {
        channel: channelId,
      };

      const response = await fetch(`${this.baseUrl}/conversations.join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.join.success', {
          description: 'Successful channel joins',
          unit: 'joins'
        }).add(1, {
          channelId,
          duration: String(Date.now() - startTime),
        });
      }

      this.context.info(`SlackWriterService.joinChannel: Successfully joined channel`, { channelId });
      return true;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.writer.join.failed', {
          description: 'Failed channel joins',
          unit: 'joins'
        }).add(1, {
          channelId,
          error: error.message,
        });
      }
      this.context.error(`SlackWriterService.joinChannel error: ${error.message}`, { channelId, error });
      return false;
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

  async onStartup(): Promise<void> {
    this.context.info('SlackWriterService starting up...');
    
    // Test the connection if token is available
    if (this.apiToken) {
      try {
        const response = await fetch(`${this.baseUrl}/auth.test`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        const data = await response.json();
        if (data.ok) {
          this.context.info(`SlackWriterService connected successfully as ${data.user} in team ${data.team}`);
        } else {
          this.context.warn(`SlackWriterService connection test failed: ${data.error}`);
        }
      } catch (error) {
        this.context.warn(`SlackWriterService connection test failed: ${error.message}`);
      }
    } else {
      this.context.warn('SlackWriterService: No Slack API token found. Set SLACK_BOT_TOKEN or SLACK_API_TOKEN environment variable.');
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

export default SlackWriterService;