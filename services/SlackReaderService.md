# SlackReaderService

The `SlackReaderService` is responsible for reading messages from Slack channels. It provides methods to fetch messages from specific channels using the Slack REST API.

## Configuration

Set one of the following environment variables:
- `SLACK_BOT_TOKEN` - Bot user OAuth token (recommended)
- `SLACK_API_TOKEN` - User OAuth token

## Methods

### `readMessages(channelId: string, limit?: number, oldest?: string, latest?: string): Promise<SlackMessage[]>`
- **Description**: Fetches messages from a specified Slack channel.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
  - `limit` (optional): The maximum number of messages to fetch (default: 100, max: 1000)
  - `oldest` (optional): Only messages after this timestamp
  - `latest` (optional): Only messages before this timestamp
- **Returns**: A promise that resolves to an array of `SlackMessage` objects.

### `readThreadReplies(channelId: string, threadTs: string, limit?: number): Promise<SlackMessage[]>`
- **Description**: Fetches replies to a threaded message.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
  - `threadTs`: The timestamp of the parent message
  - `limit` (optional): The maximum number of replies to fetch (default: 100)
- **Returns**: A promise that resolves to an array of `SlackMessage` objects.

### `getChannelInfo(channelId: string): Promise<any>`
- **Description**: Gets information about a specific channel.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
- **Returns**: A promise that resolves to channel information.

### `listChannels(types?: string, limit?: number): Promise<any[]>`
- **Description**: Lists all channels the bot is a member of.
- **Parameters**:
  - `types` (optional): Comma-separated list of channel types (default: 'public_channel,private_channel')
  - `limit` (optional): The maximum number of channels to fetch (default: 100)
- **Returns**: A promise that resolves to an array of channel objects.

## Example Usage
```typescript
const readerService = new SlackReaderService();

// Read latest messages from a channel
const messages = await readerService.readMessages('C12345678', 10);

// Read thread replies
const replies = await readerService.readThreadReplies('C12345678', '1234567890.123456');

// Get channel information
const channelInfo = await readerService.getChannelInfo('C12345678');

// List all channels
const channels = await readerService.listChannels();
```

## Required Slack API Scopes

The bot token should have the following scopes:
- `channels:history` - Read messages from public channels
- `groups:history` - Read messages from private channels 
- `im:history` - Read messages from direct messages
- `mpim:history` - Read messages from group direct messages
- `channels:read` - Read basic information about public channels
- `groups:read` - Read basic information about private channels
