// filepath: /Users/wweber/Source/reactory/reactory-express-server/src/modules/reactory-slack/services/SlackConfigurationService.ts
import { service } from '@reactory/server-core/application/decorators';

interface SlackConfiguration {
  apiToken?: string;
  botToken?: string;
  signingSecret?: string;
  teamId?: string;
  botUserId?: string;
  teamName?: string;
  isConfigured: boolean;
}

/**
 * Slack Configuration Service for managing Slack API settings
 */
@service({
  id: 'slack.SlackConfigurationService@1.0.0',
  description: 'Slack Configuration Service for managing API settings',
  name: 'SlackConfigurationService',
  nameSpace: 'slack',
  version: '1.0.0',
  serviceType: 'configuration',
  dependencies: [],
})
class SlackConfigurationService implements Reactory.Service.IReactoryService {
  
  description: string = 'Slack Configuration Service for managing API settings';
  tags?: string[] = ['slack', 'configuration'];
  nameSpace: string = 'slack';
  name: string = 'SlackConfigurationService';
  version: string = '1.0.0';
  context: Reactory.Server.IReactoryContext;
  
  private configuration: SlackConfiguration;
  private readonly baseUrl: string = 'https://slack.com/api';

  constructor(_: Reactory.Service.IReactoryServiceProps, context: Reactory.Server.IReactoryContext) {
    this.context = context;
    this.configuration = this.loadConfiguration();
  }

  /**
   * Loads configuration from environment variables
   */
  private loadConfiguration(): SlackConfiguration {
    const apiToken = process.env.SLACK_API_TOKEN;
    const botToken = process.env.SLACK_BOT_TOKEN;
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    
    return {
      apiToken,
      botToken,
      signingSecret,
      teamId: process.env.SLACK_TEAM_ID,
      botUserId: process.env.SLACK_BOT_USER_ID,
      teamName: process.env.SLACK_TEAM_NAME,
      isConfigured: !!(botToken ?? apiToken),
    };
  }

  /**
   * Gets the current Slack configuration
   * @returns SlackConfiguration
   */
  getConfiguration(): SlackConfiguration {
    if (this.context?.telemetry) {
      this.context.telemetry.createCounter('slack.configuration.get', {
        description: 'Configuration retrievals',
        unit: 'requests'
      }).add(1, {
        isConfigured: String(this.configuration.isConfigured),
      });
    }
    return { ...this.configuration };
  }

  /**
   * Updates the configuration with new values
   * @param updates - Partial configuration updates
   */
  updateConfiguration(updates: Partial<SlackConfiguration>): void {
    this.configuration = {
      ...this.configuration,
      ...updates,
      isConfigured: !!(updates.botToken ?? updates.apiToken ?? this.configuration.botToken ?? this.configuration.apiToken),
    };
    
    if (this.context?.telemetry) {
      this.context.telemetry.createCounter('slack.configuration.update', {
        description: 'Configuration updates',
        unit: 'updates'
      }).add(1, {
        isConfigured: String(this.configuration.isConfigured),
        hasTeamId: String(!!this.configuration.teamId),
      });
    }
    
    this.context.info('SlackConfigurationService: Configuration updated', { 
      hasToken: this.configuration.isConfigured,
      teamId: this.configuration.teamId,
      teamName: this.configuration.teamName,
    });
  }

  /**
   * Gets the primary token (preferring bot token over user token)
   * @returns string | undefined
   */
  getToken(): string | undefined {
    return this.configuration.botToken ?? this.configuration.apiToken;
  }

  /**
   * Gets the bot token specifically
   * @returns string | undefined
   */
  getBotToken(): string | undefined {
    return this.configuration.botToken;
  }

  /**
   * Gets the signing secret for webhook verification
   * @returns string | undefined
   */
  getSigningSecret(): string | undefined {
    return this.configuration.signingSecret;
  }

  /**
   * Checks if Slack is properly configured
   * @returns boolean
   */
  isConfigured(): boolean {
    return this.configuration.isConfigured;
  }

  /**
   * Tests the current configuration by calling auth.test
   * @returns Promise with authentication info or error
   */
  async testConfiguration(): Promise<{ success: boolean; data?: any; error?: string }> {
    const startTime = Date.now();
    try {
      const token = this.getToken();
      if (!token) {
        if (this.context?.telemetry) {
          this.context.telemetry.createCounter('slack.configuration.test.failed', {
            description: 'Failed configuration tests',
            unit: 'tests'
          }).add(1, { error: 'NO_TOKEN' });
        }
        return { success: false, error: 'No API token configured' };
      }

      const response = await fetch(`${this.baseUrl}/auth.test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();

      if (data.ok) {
        // Update configuration with received info
        this.updateConfiguration({
          teamId: data.team_id,
          teamName: data.team,
          botUserId: data.user_id,
        });

        if (this.context?.telemetry) {
          this.context.telemetry.createCounter('slack.configuration.test.success', {
            description: 'Successful configuration tests',
            unit: 'tests'
          }).add(1, {
            teamId: data.team_id,
            duration: String(Date.now() - startTime),
          });
        }

        return { success: true, data };
      } else {
        if (this.context?.telemetry) {
          this.context.telemetry.createCounter('slack.configuration.test.failed', {
            description: 'Failed configuration tests',
            unit: 'tests'
          }).add(1, { error: data.error });
        }
        return { success: false, error: data.error };
      }

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.configuration.test.failed', {
          description: 'Failed configuration tests',
          unit: 'tests'
        }).add(1, { error: 'EXCEPTION' });
      }
      this.context.error(`SlackConfigurationService.testConfiguration error: ${error.message}`, { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * Validates webhook request using signing secret
   * @param timestamp - Request timestamp
   * @param body - Request body
   * @param signature - Slack signature from headers
   * @returns boolean
   */
  validateWebhookSignature(timestamp: string, body: string, signature: string): boolean {
    const signingSecret = this.getSigningSecret();
    if (!signingSecret) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.webhook.validation.failed', {
          description: 'Failed webhook validations',
          unit: 'validations'
        }).add(1, { error: 'NO_SECRET' });
      }
      this.context.warn('SlackConfigurationService: No signing secret configured for webhook validation');
      return false;
    }

    try {
      const crypto = require('crypto');
      const baseString = `v0:${timestamp}:${body}`;
      const expectedSignature = `v0=${crypto
        .createHmac('sha256', signingSecret)
        .update(baseString, 'utf8')
        .digest('hex')}`;

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter(
          isValid ? 'slack.webhook.validation.success' : 'slack.webhook.validation.failed',
          {
            description: isValid ? 'Successful webhook validations' : 'Failed webhook validations',
            unit: 'validations'
          }
        ).add(1, { error: isValid ? 'NONE' : 'SIGNATURE_MISMATCH' });
      }

      return isValid;
    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.webhook.validation.failed', {
          description: 'Failed webhook validations',
          unit: 'validations'
        }).add(1, { error: 'EXCEPTION' });
      }
      this.context.error(`SlackConfigurationService.validateWebhookSignature error: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Gets workspace information
   * @returns Promise with team info
   */
  async getTeamInfo(): Promise<any> {
    const startTime = Date.now();
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No API token configured');
      }

      const response = await fetch(`${this.baseUrl}/team.info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.team.info.success', {
          description: 'Successful team info requests',
          unit: 'requests'
        }).add(1, {
          duration: String(Date.now() - startTime),
        });
      }

      return data.team;

    } catch (error) {
      if (this.context?.telemetry) {
        this.context.telemetry.createCounter('slack.team.info.failed', {
          description: 'Failed team info requests',
          unit: 'requests'
        }).add(1, { error: error.message });
      }
      this.context.error(`SlackConfigurationService.getTeamInfo error: ${error.message}`, { error });
      throw error;
    }
  }

  async onStartup(): Promise<void> {
    this.context.info('SlackConfigurationService starting up...');
    
    if (this.isConfigured()) {
      const testResult = await this.testConfiguration();
      if (testResult.success) {
        this.context.info(`SlackConfigurationService: Successfully connected to team "${testResult.data.team}"`);
      } else {
        this.context.warn(`SlackConfigurationService: Configuration test failed: ${testResult.error}`);
      }
    } else {
      this.context.warn('SlackConfigurationService: No Slack tokens configured. Set SLACK_BOT_TOKEN or SLACK_API_TOKEN environment variable.');
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

export default SlackConfigurationService;