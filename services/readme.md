# Reactory Slack Services

This directory contains the core services for interacting with the Slack REST API within the Reactory platform.

## Services

### SlackReaderService
Handles reading messages and information from Slack channels.
- Read messages from channels with pagination support
- Read thread replies
- Get channel information
- List available channels
- Support for various channel types (public, private, DM, group DM)

See [SlackReaderService.md](./SlackReaderService.md) for detailed documentation.

### SlackWriterService
Handles writing messages and interactions to Slack channels.
- Send messages to channels
- Send threaded replies
- Update existing messages
- Delete messages
- Add reactions to messages
- Join channels

See [SlackWriterService.md](./SlackWriterService.md) for detailed documentation.

### SlackConfigurationService
Manages Slack API configuration and authentication.
- Load configuration from environment variables
- Test API connections
- Validate webhook signatures
- Manage team information
- Handle multiple token types (bot and user tokens)

See [SlackConfigurationService.md](./SlackConfigurationService.md) for detailed documentation.

## Environment Variables

Set the following environment variables to configure the Slack services:

```bash
# Required: At least one token is needed
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_API_TOKEN=xoxp-your-user-token

# Optional: For webhook verification
SLACK_SIGNING_SECRET=your-signing-secret

# Optional: Team information (auto-detected if not provided)
SLACK_TEAM_ID=T12345678
SLACK_TEAM_NAME=your-team-name
SLACK_BOT_USER_ID=U12345678
```

## Required Scopes

### Bot Token Scopes
- `channels:history` - Read messages from public channels
- `channels:read` - Read basic information about public channels
- `channels:write` - Write messages to public channels
- `chat:write` - Send messages as the bot
- `groups:history` - Read messages from private channels
- `groups:read` - Read basic information about private channels
- `groups:write` - Write messages to private channels
- `im:history` - Read messages from direct messages
- `im:read` - Read basic information about direct messages
- `im:write` - Write messages to direct messages
- `mpim:history` - Read messages from group direct messages
- `mpim:read` - Read basic information about group direct messages
- `mpim:write` - Write messages to group direct messages
- `reactions:write` - Add reactions to messages

### User Token Scopes (if using SLACK_API_TOKEN)
- Similar scopes but with user permissions instead of bot permissions

## Usage Examples

```typescript
// Get services from Reactory context
const readerService = context.getService<SlackReaderService>('slack.SlackReaderService@1.0.0');
const writerService = context.getService<SlackWriterService>('slack.SlackWriterService@1.0.0');
const configService = context.getService<SlackConfigurationService>('slack.SlackConfigurationService@1.0.0');

// Check if Slack is configured
if (configService.isConfigured()) {
  // Read messages
  const messages = await readerService.readMessages('C12345678', 10);
  
  // Send a message
  await writerService.writeMessage('C12345678', 'Hello from Reactory!');
  
  // Get team info
  const teamInfo = await configService.getTeamInfo();
}
```

SLACK_CHANNEL_ID_1=C04QJFWSFK8
SLACK_CHANNEL_ID_2=CR9MQ4RFV
SLACK_BOT_TOKEN=xoxp-4334483709408-637002348278-6769710025776-95465c5bd291bed7f3a280a613d0961e
SLACK_BOT_TOKEN_BOT=xoxb-4334483709408-7997851169813-1HwatbUCgFESPozh7jAlA5E0
#prd channel
SLACK_CHANNEL_POST=C07UW2181C3
# testchannel
# SLACK_CHANNEL_POST=C083KEGBV4J
REQUEST_CHANNEL=C071VQ35FC7
