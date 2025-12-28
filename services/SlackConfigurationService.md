# SlackConfigurationService

The `SlackConfigurationService` is responsible for managing Slack API configuration settings, authentication, and workspace information. It provides methods to configure, test, and validate Slack API connections.

## Configuration

The service loads configuration from the following environment variables:

### Required (at least one)
- `SLACK_BOT_TOKEN` - Bot user OAuth token (recommended)
- `SLACK_API_TOKEN` - User OAuth token

### Optional
- `SLACK_SIGNING_SECRET` - For webhook request verification
- `SLACK_TEAM_ID` - Team ID (auto-detected if not provided)
- `SLACK_TEAM_NAME` - Team name (auto-detected if not provided)
- `SLACK_BOT_USER_ID` - Bot user ID (auto-detected if not provided)

## Methods

### `getConfiguration(): SlackConfiguration`
- **Description**: Retrieves the current Slack API configuration.
- **Returns**: An object containing the current configuration including tokens, team info, and configuration status.

### `updateConfiguration(updates: Partial<SlackConfiguration>): void`
- **Description**: Updates the configuration with new values.
- **Parameters**:
  - `updates`: Partial configuration object with new values

### `getToken(): string | undefined`
- **Description**: Gets the primary token (preferring bot token over user token).
- **Returns**: The API token to use for requests.

### `getBotToken(): string | undefined`
- **Description**: Gets the bot token specifically.
- **Returns**: The bot token if available.

### `getSigningSecret(): string | undefined`
- **Description**: Gets the signing secret for webhook verification.
- **Returns**: The signing secret if configured.

### `isConfigured(): boolean`
- **Description**: Checks if Slack is properly configured with at least one token.
- **Returns**: `true` if configured, `false` otherwise.

### `testConfiguration(): Promise<{success: boolean; data?: any; error?: string}>`
- **Description**: Tests the current configuration by calling the Slack auth.test API.
- **Returns**: A promise with the test result including success status and optional data or error.

### `validateWebhookSignature(timestamp: string, body: string, signature: string): boolean`
- **Description**: Validates webhook request signatures using the signing secret.
- **Parameters**:
  - `timestamp`: Request timestamp from headers
  - `body`: Raw request body
  - `signature`: Slack signature from headers
- **Returns**: `true` if signature is valid, `false` otherwise.

### `getTeamInfo(): Promise<any>`
- **Description**: Gets workspace/team information from Slack.
- **Returns**: A promise that resolves to team information.

## Example Usage
```typescript
const configService = new SlackConfigurationService();

// Check if configured
if (configService.isConfigured()) {
  // Test the connection
  const testResult = await configService.testConfiguration();
  if (testResult.success) {
    console.log('Connected to:', testResult.data.team);
  }
  
  // Get current configuration
  const config = configService.getConfiguration();
  console.log('Team:', config.teamName);
  
  // Get team info
  const teamInfo = await configService.getTeamInfo();
  
  // Validate webhook (in webhook handler)
  const isValid = configService.validateWebhookSignature(
    req.headers['x-slack-request-timestamp'],
    req.body,
    req.headers['x-slack-signature']
  );
}

// Update configuration programmatically
configService.updateConfiguration({
  teamName: 'My Team',
  botUserId: 'U12345678'
});
```

## SlackConfiguration Interface

```typescript
interface SlackConfiguration {
  apiToken?: string;
  botToken?: string;
  signingSecret?: string;
  teamId?: string;
  botUserId?: string;
  teamName?: string;
  isConfigured: boolean;
}
```

## Security Considerations

- **Token Storage**: Tokens are loaded from environment variables and should never be hardcoded
- **Webhook Verification**: Always use `validateWebhookSignature()` to verify incoming webhook requests
- **Token Preference**: The service prefers bot tokens over user tokens for security and functionality
- **Logging**: Sensitive information like tokens are not logged; only metadata is logged for debugging

## Auto-Detection

When `testConfiguration()` is called successfully, the service automatically updates the configuration with:
- Team ID
- Team name  
- Bot user ID

This eliminates the need to manually configure these values in most cases.
