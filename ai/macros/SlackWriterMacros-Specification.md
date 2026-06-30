# Slack Writer Macros - Specification

## Overview

This specification defines the **Slack Writer Macros** for the Reactory Slack module. These macros provide AI-driven capabilities for writing, updating, deleting messages, adding reactions, and joining channels in Slack workspaces.

The macros follow the same pattern as the existing `SlackReaderMacros`, ensuring consistency in the API and code structure.

---

## Macro Definitions

### 1. `writeSlackMessage`

**Description:** Write a message to a Slack channel or direct message.

**Signature:**
```typescript
export const SlackWriteMessage: Macro<any, {
  channelId: string;
  message: string;
  threadTs?: string;
  botToken?: string;
  format?: string;
}>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | The ID of the Slack channel or direct message |
| `message` | string | Yes | The message content to send |
| `threadTs` | string | No | Optional timestamp of parent message for threaded reply |
| `botToken` | string | No | The bot token to use for authentication (optional) |
| `format` | string | No | Format of the output (optional). Defaults to `'json'`. Options: `json`, `markdown`, `html`, `csv` |

**Behavior:**
1. Validate `botToken` - use provided token or fall back to `SLACK_BOT_TOKEN` environment variable
2. Call `SlackWriterService.writeMessage(channelId, message, threadTs)`
3. Format the response based on the requested format
4. Return success/error with appropriate instructions

**Return Type:**
```typescript
{
  success: boolean;
  data: any; // Formatted output or raw response
  tool: 'writeSlackMessage';
  params: any;
  format: string;
  instructions: string; // Human-readable summary and next steps
}
```

**Error Handling:**
- Missing/invalid bot token: Return authentication error with recovery options
- API error: Return error message with recovery options (verify channelId, check scopes)
- Network error: Return network error with retry suggestions

---

### 2. `updateSlackMessage`

**Description:** Update an existing message in a Slack channel.

**Signature:**
```typescript
export const SlackUpdateMessage: Macro<any, {
  channelId: string;
  messageTs: string;
  newText: string;
  botToken?: string;
  format?: string;
}>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | The ID of the Slack channel |
| `messageTs` | string | Yes | The timestamp of the message to update |
| `newText` | string | Yes | The new message content |
| `botToken` | string | No | The bot token to use for authentication (optional) |
| `format` | string | No | Format of the output (optional). Defaults to `'json'`. Options: `json`, `markdown`, `html`, `csv` |

**Behavior:**
1. Validate `botToken` - use provided token or fall back to `SLACK_BOT_TOKEN` environment variable
2. Call `SlackWriterService.updateMessage(channelId, messageTs, newText)`
3. Format the response based on the requested format
4. Return success/error with appropriate instructions

**Return Type:**
```typescript
{
  success: boolean;
  data: boolean; // true if updated successfully
  tool: 'updateSlackMessage';
  params: any;
  format: string;
  instructions: string; // Human-readable summary and next steps
}
```

**Error Handling:**
- Missing/invalid bot token: Return authentication error with recovery options
- API error: Return error message with recovery options (verify messageTs, check scopes)
- Network error: Return network error with retry suggestions

---

### 3. `deleteSlackMessage`

**Description:** Delete a message from a Slack channel.

**Signature:**
```typescript
export const SlackDeleteMessage: Macro<any, {
  channelId: string;
  messageTs: string;
  botToken?: string;
  format?: string;
}>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | The ID of the Slack channel |
| `messageTs` | string | Yes | The timestamp of the message to delete |
| `botToken` | string | No | The bot token to use for authentication (optional) |
| `format` | string | No | Format of the output (optional). Defaults to `'json'`. Options: `json`, `markdown`, `html`, `csv` |

**Behavior:**
1. Validate `botToken` - use provided token or fall back to `SLACK_BOT_TOKEN` environment variable
2. Call `SlackWriterService.deleteMessage(channelId, messageTs)`
3. Format the response based on the requested format
4. Return success/error with appropriate instructions

**Return Type:**
```typescript
{
  success: boolean;
  data: boolean; // true if deleted successfully
  tool: 'deleteSlackMessage';
  params: any;
  format: string;
  instructions: string; // Human-readable summary and next steps
}
```

**Error Handling:**
- Missing/invalid bot token: Return authentication error with recovery options
- API error: Return error message with recovery options (verify messageTs, check scopes)
- Network error: Return network error with retry suggestions

---

### 4. `addSlackReaction`

**Description:** Add an emoji reaction to a message in a Slack channel.

**Signature:**
```typescript
export const SlackAddReaction: Macro<any, {
  channelId: string;
  messageTs: string;
  reaction: string;
  botToken?: string;
  format?: string;
}>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | The ID of the Slack channel |
| `messageTs` | string | Yes | The timestamp of the message to react to |
| `reaction` | string | Yes | The emoji reaction to add (without colons, e.g., 'thumbsup', 'heart') |
| `botToken` | string | No | The bot token to use for authentication (optional) |
| `format` | string | No | Format of the output (optional). Defaults to `'json'`. Options: `json`, `markdown`, `html`, `csv` |

**Behavior:**
1. Validate `botToken` - use provided token or fall back to `SLACK_BOT_TOKEN` environment variable
2. Call `SlackWriterService.addReaction(channelId, messageTs, reaction)`
3. Format the response based on the requested format
4. Return success/error with appropriate instructions

**Return Type:**
```typescript
{
  success: boolean;
  data: boolean; // true if reaction added successfully
  tool: 'addSlackReaction';
  params: any;
  format: string;
  instructions: string; // Human-readable summary and next steps
}
```

**Error Handling:**
- Missing/invalid bot token: Return authentication error with recovery options
- API error: Return error message with recovery options (verify messageTs, check scopes)
- Network error: Return network error with retry suggestions

---

### 5. `joinSlackChannel`

**Description:** Join a Slack channel.

**Signature:**
```typescript
export const SlackJoinChannel: Macro<any, {
  channelId: string;
  botToken?: string;
  format?: string;
}>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | The ID of the Slack channel to join |
| `botToken` | string | No | The bot token to use for authentication (optional) |
| `format` | string | No | Format of the output (optional). Defaults to `'json'`. Options: `json`, `markdown`, `html`, `csv` |

**Behavior:**
1. Validate `botToken` - use provided token or fall back to `SLACK_BOT_TOKEN` environment variable
2. Call `SlackWriterService.joinChannel(channelId)`
3. Format the response based on the requested format
4. Return success/error with appropriate instructions

**Return Type:**
```typescript
{
  success: boolean;
  data: boolean; // true if joined successfully
  tool: 'joinSlackChannel';
  params: any;
  format: string;
  instructions: string; // Human-readable summary and next steps
}
```

**Error Handling:**
- Missing/invalid bot token: Return authentication error with recovery options
- API error: Return error message with recovery options (verify channelId, check scopes)
- Network error: Return network error with retry suggestions

---

## Shared Patterns

### Authentication

All macros follow the same authentication pattern:

```typescript
const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
if (!validBotToken || validBotToken.trim() === '') {
  return { 
    success: false, 
    error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
    tool: 'macroName', 
    params: props,
    instructions: `## ${MacroName} — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
  };
}

const slackWriter = context.getService<SlackWriterService>("slack.SlackWriterService@1.0.0", {
  SLACK_BOT_TOKEN: validBotToken
});
```

### Response Formatting

All macros support multiple output formats:

```typescript
let output;
switch (format) {
  case 'markdown':
    output = formattedMarkdown;
    break;
  case 'html':
    output = formattedHtml;
    break;
  case 'csv':
    output = formattedCsv;
    break;
  default:
    output = rawResponse;
}
```

### Error Handling

All macros follow the same error handling pattern:

```typescript
try {
  // ... macro logic
  return { success: true, data: output, tool: 'macroName', params: props, format,
    instructions: `## MacroName — Success\n\nOperation completed successfully in ${format} format.\n\n### Suggested Next Steps:\n- ...`
  };
} catch (err) {
  return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'macroName', params: props,
    instructions: `## MacroName — Error\n\nFailed to perform operation: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- ...`
  };
}
```

### Instructions Generation

Each macro generates human-readable instructions that include:
- A summary of what was accomplished
- The format used
- Suggested next steps or related operations

---

## Test Plan

### Test Cases

#### 1. Authentication Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-1: Valid bot token provided | `botToken: "xoxb-..."` | Success, message written |
| TC-2: Invalid bot token provided | `botToken: "invalid-token"` | Authentication error |
| TC-3: No bot token provided, SLACK_BOT_TOKEN set | `botToken: undefined` | Success, uses env var |
| TC-4: No bot token provided, SLACK_BOT_TOKEN not set | `botToken: undefined` | Authentication error |
| TC-5: Empty bot token | `botToken: ""` | Authentication error |
| TC-6: Whitespace-only bot token | `botToken: "   "` | Authentication error |

#### 2. Write Message Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-7: Write message to channel | `channelId: "C123", message: "Hello"` | Success, message sent |
| TC-8: Write message with thread | `channelId: "C123", message: "Hello", threadTs: "1234567890.123"` | Success, threaded message sent |
| TC-9: Write empty message | `channelId: "C123", message: ""` | API error (Slack rejects empty messages) |
| TC-10: Write message to non-existent channel | `channelId: "C999", message: "Hello"` | API error (channel not found) |
| TC-11: Write message with special characters | `channelId: "C123", message: "Hello & goodbye!"` | Success, message sent with special chars |
| TC-12: Write long message | `channelId: "C123", message: "A".repeat(10000)` | API error (message too long) |

#### 3. Update Message Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-13: Update existing message | `channelId: "C123", messageTs: "1234567890.123", newText: "Updated"` | Success, message updated |
| TC-14: Update non-existent message | `channelId: "C123", messageTs: "invalid", newText: "Updated"` | API error (message not found) |
| TC-15: Update message with same text | `channelId: "C123", messageTs: "1234567890.123", newText: "Same text"` | Success (Slack allows this) |

#### 4. Delete Message Tests

| Test Case | Input | Expected Result |
|-----------|-------|----------------- |
| TC-16: Delete existing message | `channelId: "C123", messageTs: "1234567890.123"` | Success, message deleted |
| TC-17: Delete non-existent message | `channelId: "C123", messageTs: "invalid"` | API error (message not found) |

#### 5. Add Reaction Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-18: Add valid reaction | `channelId: "C123", messageTs: "1234567890.123", reaction: "thumbsup"` | Success, reaction added |
| TC-19: Add invalid reaction | `channelId: "C123", messageTs: "1234567890.123", reaction: "invalid_emoji"` | API error (invalid reaction) |
| TC-20: Add reaction to non-existent message | `channelId: "C123", messageTs: "invalid", reaction: "thumbsup"` | API error (message not found) |

#### 6. Join Channel Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-21: Join existing channel | `channelId: "C123"` | Success, joined channel |
| TC-22: Join non-existent channel | `channelId: "C999"` | API error (channel not found) |

#### 7. Format Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-23: JSON format | `format: "json"` | Raw JSON response |
| TC-24: Markdown format | `format: "markdown"` | Formatted markdown output |
| TC-25: HTML format | `format: "html"` | Formatted HTML output |
| TC-26: CSV format | `format: "csv"` | Formatted CSV output |

#### 8. Error Recovery Tests

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| TC-27: Retry after auth error | Fix bot token and retry | Success on retry |
| TC-28: Handle network timeout | Simulate network error | Error returned with retry suggestion |

---

## Implementation Notes

### File Structure

```
ai/macros/
├── SlackReaderMacros.ts    # Existing reader macros
└── SlackWriterMacros.ts    # New writer macros (to be created)
```

### Code Structure

Each macro follows this pattern:

```typescript
/**
 * Macro to [describe operation]
 */
export const SlackMacroName: Macro<any, {
  // parameters
}> = async (props, state, context) => {
  // 1. Validate botToken
  // 2. Get service instance
  // 3. Try/catch block
  //    - Success: format response
  //    - Error: return error with instructions
};

export const SlackMacroNameRegistry: MacroComponentDefinition<typeof SlackMacroName> = {
  nameSpace: "slack-macros",
  name: "macroName",
  version: "1.0.0",
  component: SlackMacroName,
  description: `# macroName macro\n[Description]\n\n## Usage\n@macroName(params) - [what it does].`,
  features: [
    {
      feature: "[action]",
      featureType: Reactory.FeatureType.function,
      action: ["action1", "action2"],
      description: "[Description]",
      stem: "[stem]"
    }
  ],
  stem: "slack",
  alias: "macroName",
  tags: ["slack", "[action]", "[operation]"],
  runat: "server",
  roles: ["USER"],
  icon: "[icon]",
  tools: [
    {
      type: "function",
      function: {
        name: "macroName",
        description: "[Description]",
        parameters: {
          type: "object",
          properties: {
            // parameter definitions
          },
          required: ["requiredParams"]
        }
      }
    }
  ]
};
```

### Dependencies

- `@reactory/server-modules/reactory-reactor/ai/openai/types/chat` - Macro types
- `@reactorynet/reactory-core` - Reactory core
- `@reactory/server-modules/reactory-slack/services/SlackWriterService` - Writer service

---

## Next Steps

1. Review this specification
2. Approve or modify the specification
3. Create `SlackWriterMacros.ts` implementation
4. Write unit tests
5. Integrate into `ai/macros/index.ts`
6. Update module registration in `index.ts`

---

*Created: 2026-06-29*
*Author: Reactor AI*
