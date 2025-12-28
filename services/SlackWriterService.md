# SlackWriterService

The `SlackWriterService` is responsible for writing messages and interactions to Slack channels. It provides methods to send messages, update content, and manage channel interactions using the Slack REST API.

## Configuration

Set one of the following environment variables:
- `SLACK_BOT_TOKEN` - Bot user OAuth token (recommended)
- `SLACK_API_TOKEN` - User OAuth token

## Methods

### `writeMessage(channelId: string, message: string, threadTs?: string): Promise<boolean>`
- **Description**: Sends a message to a specified Slack channel.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
  - `message`: The message content to send
  - `threadTs` (optional): Timestamp of parent message for threaded reply
- **Returns**: A promise that resolves to `true` if the message was sent successfully, or `false` otherwise.

### `updateMessage(channelId: string, messageTs: string, newText: string): Promise<boolean>`
- **Description**: Updates an existing message in a Slack channel.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
  - `messageTs`: The timestamp of the message to update
  - `newText`: The new message content
- **Returns**: A promise that resolves to `true` if successful, or `false` otherwise.

### `deleteMessage(channelId: string, messageTs: string): Promise<boolean>`
- **Description**: Deletes a message from a Slack channel.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
  - `messageTs`: The timestamp of the message to delete
- **Returns**: A promise that resolves to `true` if successful, or `false` otherwise.

### `addReaction(channelId: string, messageTs: string, reaction: string): Promise<boolean>`
- **Description**: Adds a reaction to a message.
- **Parameters**:
  - `channelId`: The ID of the Slack channel
  - `messageTs`: The timestamp of the message
  - `reaction`: The emoji reaction to add (without colons, e.g., 'thumbsup')
- **Returns**: A promise that resolves to `true` if successful, or `false` otherwise.

### `joinChannel(channelId: string): Promise<boolean>`
- **Description**: Joins a channel.
- **Parameters**:
  - `channelId`: The ID of the Slack channel to join
- **Returns**: A promise that resolves to `true` if successful, or `false` otherwise.

## Example Usage
```typescript
const writerService = new SlackWriterService();

// Send a simple message
await writerService.writeMessage('C12345678', 'Hello, Slack!');

// Send a threaded reply
await writerService.writeMessage('C12345678', 'This is a reply', '1234567890.123456');

// Update a message
await writerService.updateMessage('C12345678', '1234567890.123456', 'Updated message');

// Add a reaction
await writerService.addReaction('C12345678', '1234567890.123456', 'thumbsup');

// Join a channel
await writerService.joinChannel('C12345678');
```

## Required Slack API Scopes

The bot token should have the following scopes:
- `chat:write` - Send messages as the bot
- `channels:write` - Write messages to public channels
- `groups:write` - Write messages to private channels
- `im:write` - Write messages to direct messages
- `mpim:write` - Write messages to group direct messages
- `reactions:write` - Add reactions to messages
- `channels:join` - Join public channels

## Error Handling

All methods return boolean values indicating success or failure. Detailed error information is logged through the Reactory context logging system. Methods will return `false` in case of:
- Missing or invalid API token
- Invalid channel ID
- Insufficient permissions
- Network or API errors
- Rate limiting (temporary failures)
