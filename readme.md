# Reactory Slack Module

The Reactory Slack module provides comprehensive integration with the Slack REST API, enabling your Reactory applications to interact with Slack workspaces through services, GraphQL resolvers, forms, and other components.

## Overview

This module follows the Reactory platform's convention-over-configuration approach, providing a clean and intuitive interface for Slack operations including:

- **Message Operations**: Read, write, update, and delete messages
- **Channel Management**: Join channels, retrieve channel information, and list channels
- **Thread Management**: Handle threaded conversations and replies
- **Reactions**: Add and remove emoji reactions to messages
- **Configuration**: Manage Slack API credentials and workspace settings
- **Authentication**: Support for both bot tokens and user tokens

## Architecture

The module is built on the Reactory service pattern with three core services:

- **SlackReaderService**: Handles all read operations (messages, channels, threads)
- **SlackWriterService**: Manages write operations (sending, updating, deleting messages)
- **SlackConfigurationService**: Handles API configuration and connection management

## Features

### Message Operations
- Send messages to channels or direct messages
- Read message history from channels
- Update and delete existing messages
- Handle threaded conversations
- Add/remove emoji reactions

### Channel Management
- Join public and private channels
- Retrieve channel information and metadata
- List all channels in a workspace
- Search for channels by name or purpose

### Authentication & Security
- Support for Bot User OAuth Tokens (`xoxb-`)
- Support for User OAuth Tokens (`xoxp-`)
- Automatic token validation and testing
- Secure credential management through environment variables

### Configuration Management
- Auto-detect workspace configuration
- Test API connections and permissions
- Validate webhook URLs
- Manage team and bot information

## Installation & Setup

### Environment Variables

Configure the following environment variables for Slack API access:

```bash
# Primary Slack API Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token          # Bot User OAuth Token (preferred)
SLACK_USER_TOKEN=xoxp-your-user-token        # User OAuth Token (optional)
SLACK_SIGNING_SECRET=your-signing-secret     # For webhook verification
SLACK_CLIENT_ID=your-client-id               # App credentials
SLACK_CLIENT_SECRET=your-client-secret       # App credentials

# Optional Configuration
SLACK_APP_TOKEN=xapp-your-app-token          # Socket mode token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... # Incoming webhook
```

### Required Slack OAuth Scopes

For **Bot Tokens** (`xoxb-`):
```
channels:read       # Read public channel information
channels:history    # Read messages in public channels
channels:join       # Join public channels
chat:write         # Send messages
chat:write.public  # Send messages to channels bot isn't in
groups:read        # Read private channel information
groups:history     # Read messages in private channels
im:read           # Read direct messages
im:history        # Read DM history
im:write          # Send direct messages
mpim:read         # Read group DMs
mpim:history      # Read group DM history
reactions:read    # Read reactions
reactions:write   # Add reactions
users:read        # Read user information
```

For **User Tokens** (`xoxp-`):
```
channels:read
channels:history
channels:write
chat:write:user
groups:read
groups:history
groups:write
im:read
im:history
im:write
mpim:read
mpim:history
mpim:write
reactions:read
reactions:write
users:read
```

### Slack App Configuration

1. Create a new Slack app at https://api.slack.com/apps
2. Configure OAuth & Permissions with the required scopes
3. Install the app to your workspace
4. Copy the Bot User OAuth Token and other credentials
5. Set up environment variables in your Reactory application

## Usage Examples

### Reading Messages

```typescript
import { SlackReaderService } from '@reactory/slack';

const slackReader = new SlackReaderService();

// Read latest messages from a channel
const messages = await slackReader.readMessages('C1234567890', { limit: 10 });

// Read a specific thread
const thread = await slackReader.readThread('C1234567890', '1234567890.123456');

// Get channel information
const channel = await slackReader.getChannelInfo('C1234567890');
```

### Writing Messages

```typescript
import { SlackWriterService } from '@reactory/slack';

const slackWriter = new SlackWriterService();

// Send a message to a channel
const result = await slackWriter.writeMessage('C1234567890', 'Hello, world!');

// Send a direct message
const dmResult = await slackWriter.writeMessage('@username', 'Private message');

// Update an existing message
const updated = await slackWriter.updateMessage('C1234567890', '1234567890.123456', 'Updated message');

// Add a reaction
await slackWriter.addReaction('C1234567890', '1234567890.123456', 'thumbsup');
```

### Configuration Management

```typescript
import { SlackConfigurationService } from '@reactory/slack';

const slackConfig = new SlackConfigurationService();

// Test API connection
const isConnected = await slackConfig.testConnection();

// Get workspace info
const teamInfo = await slackConfig.getTeamInfo();

// Validate webhook URL
const isValidWebhook = await slackConfig.validateWebhook('https://hooks.slack.com/...');
```

## Service Documentation

For detailed documentation on each service, see:

- [SlackReaderService](./services/SlackReaderService.md) - Reading messages, channels, and threads
- [SlackWriterService](./services/SlackWriterService.md) - Writing and updating messages
- [SlackConfigurationService](./services/SlackConfigurationService.md) - Configuration and connection management
- [Services Overview](./services/readme.md) - Complete service documentation

## Types and Interfaces

The module includes comprehensive TypeScript types for all Slack API objects:

```typescript
interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
  user?: string;
  text?: string;
  thread_ts?: string;
  reply_count?: number;
  // ... additional properties
}

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  // ... additional properties
}
```

## Error Handling

All services include robust error handling with:

- Detailed error logging through Reactory context
- Structured error responses with Slack API error codes
- Automatic retry logic for rate-limited requests
- Graceful fallbacks for missing permissions

## Security Considerations

- Store API tokens securely using environment variables
- Use Bot tokens instead of User tokens when possible
- Implement proper webhook signature verification
- Regularly rotate API credentials
- Monitor API usage for suspicious activity

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify tokens and scopes in Slack app settings
2. **Permission Denied**: Check that bot has required OAuth scopes
3. **Channel Not Found**: Ensure bot is member of private channels
4. **Rate Limiting**: Services implement automatic retry with backoff

### Debug Logging

Enable debug logging by setting log level in your Reactory configuration:

```typescript
// Enable detailed API request/response logging
logger.setLevel('debug');
```

## Contributing

Contributions are welcome! Please follow the Reactory platform conventions:

- Use the established service patterns
- Include comprehensive error handling
- Add TypeScript types for all API objects
- Update documentation for new features
- Follow the plugin architecture where possible

## License

This module is part of the Reactory platform and follows the same licensing terms.

---

*For more information about the Reactory platform, visit the main documentation in `reactory-docs`.*