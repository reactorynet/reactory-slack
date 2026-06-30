import { Macro, MacroComponentDefinition, ChatState } from "@reactory/server-modules/reactory-reactor/ai/openai/types/chat";
import Reactory from "@reactorynet/reactory-core";
import SlackWriterService from "@reactory/server-modules/reactory-slack/services/SlackWriterService";

/**
 * Macro to write a message to a Slack channel
 */
export const SlackWriteMessage: Macro<any, {
  channelId: string; limit?: number; oldest?: string; latest?: string; botToken?: string; format?: string;
}> = async (
  props,
  state,
  context
) => {
  const { channelId, message, threadTs, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'writeSlackMessage', 
      params: props,
      instructions: `## Write Slack Message — Authentication Error\n\nNo valid Slack bot token available. Checked provided botToken param and SLACK_BOT_TOKEN env var.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set\n- Use \`listSlackChannels\` to verify token validity first`
    };
  }
  
  const slackWriter = context.getService<SlackWriterService>("slack.SlackWriterService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const result = await slackWriter.writeMessage(channelId, message, threadTs);
    let output;
    switch (format) {
      case 'markdown':
        output = result.ok ? `✅ Message sent to channel **${channelId}**\n\n- Timestamp: ${result.ts || 'N/A'}\n- Channel: ${result.channel || 'N/A'}` : `❌ Failed to send message\n\nError: ${result.error || 'Unknown error'}`;
        break;
      case 'html':
        output = result.ok ? `<div>✅ Message sent to channel <b>${channelId}</b></div><p>Timestamp: ${result.ts || 'N/A'}</p><p>Channel: ${result.channel || 'N/A'}</p>` : `<div>❌ Failed to send message</div><p>Error: ${result.error || 'Unknown error'}</p>`;
        break;
      case 'csv':
        output = result.ok ? `ok,ts,channel\n${result.ok},${result.ts || '',result.channel || ''}` : `ok,error\n${result.ok},${result.error || ''}`;
        break;
      default:
        output = result;
    }
    return { success: true, data: output, tool: 'writeSlackMessage', params: props, format,
      instructions: `## Slack Message — Channel ${channelId}\n\nMessage sent successfully in ${format} format.${threadTs ? ` Thread: ${threadTs}` : ''}\n\n### Suggested Next Steps:\n- Use \`updateSlackMessage\` to modify this message\n- Use \`deleteSlackMessage\` to remove this message\n- Use \`addSlackReaction\` to react to this message`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'writeSlackMessage', params: props,
      instructions: `## Write Slack Message — Error\n\nFailed to write message to channel ${channelId}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify the channelId is correct using \`listSlackChannels\`\n- Check bot token permissions (chat:write scope required)\n- Ensure message content is not empty or exceeds Slack limits`
    };
  }
};

export const SlackWriteMessageRegistry: MacroComponentDefinition<typeof SlackWriteMessage> = {
  nameSpace: "slack-macros",
  name: "writeSlackMessage",
  version: "1.0.0",
  component: SlackWriteMessage,
  description: `# writeSlackMessage macro\nWrite a message to a Slack channel.\n\n## Usage\n@writeSlackMessage(channelId, message, threadTs?, botToken?, format?) - sends a message to the specified channel.`,
  features: [
    {
      feature: "write",
      featureType: Reactory.FeatureType.function,
      action: ["write", "send", "post"],
      description: "Writes a message to a Slack channel.",
      stem: "write"
    }
  ],
  stem: "slack",
  alias: "writeSlackMessage",
  roles: ["USER"],
  icon: "send",
  tags: ["slack", "write", "messages", "channel"],
  runat: "server",
  roles: ["USER"],
  tools: [
    {
      type: "function",
      roles: ["USER"],
      function: {
        name: "writeSlackMessage",
        icon: "send",
        description: "Write a message to a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            message: { type: "string", description: "The message content to send." },
            threadTs: { type: "string", description: "Optional timestamp of parent message for threaded reply (optional)."},
            botToken: { type: "string", description: "The bot token to use for authentication (optional)."},
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'json'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "json"
            }
          },
          required: ["channelId", "message"]
        }
      }
    }
  ]
};

/**
 * Macro to update an existing message in a Slack channel
 */
export const SlackUpdateMessage: Macro<any, {
  channelId: string; messageTs: string; newText: string; botToken?: string; format?: string;
}> = async (
  props,
  state,
  context
) => {
  const { channelId, messageTs, newText, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'updateSlackMessage', 
      params: props,
      instructions: `## Update Slack Message — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackWriter = context.getService<SlackWriterService>("slack.SlackWriterService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const updated = await slackWriter.updateMessage(channelId, messageTs, newText);
    let output;
    switch (format) {
      case 'markdown':
        output = updated ? `✅ Message updated in channel **${channelId}**\n\n- Updated timestamp: ${messageTs}` : `❌ Failed to update message`;
        break;
      case 'html':
        output = updated ? `<div>✅ Message updated in channel <b>${channelId}</b></div><p>Updated timestamp: ${messageTs}</p>` : `<div>❌ Failed to update message</div>`;
        break;
      case 'csv':
        output = updated ? `updated,channelId,messageTs\n${updated},${channelId},${messageTs}` : `updated,error\n${updated},`;
        break;
      default:
        output = updated;
    }
    return { success: true, data: output, tool: 'updateSlackMessage', params: props, format,
      instructions: `## Slack Message Update — Channel ${channelId}\n\nMessage updated successfully in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` to view the updated message\n- Use \`deleteSlackMessage\` to remove the message\n- Use \`addSlackReaction\` to react to the message`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'updateSlackMessage', params: props,
      instructions: `## Update Slack Message — Error\n\nFailed to update message in channel ${channelId} with timestamp ${messageTs}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify the channelId and messageTs are correct\n- Use \`readSlackMessages\` to find valid message timestamps\n- Check bot token permissions (chat:write scope required)`
    };
  }
};

export const SlackUpdateMessageRegistry: MacroComponentDefinition<typeof SlackUpdateMessage> = {
  nameSpace: "slack-macros",
  name: "updateSlackMessage",
  version: "1.0.0",
  component: SlackUpdateMessage,
  description: `# updateSlackMessage macro\nUpdate an existing message in a Slack channel.\n\n## Usage\n@updateSlackMessage(channelId, messageTs, newText, botToken?, format?) - updates the message with the specified timestamp.`,
  features: [
    {
      feature: "update",
      featureType: Reactory.FeatureType.function,
      action: ["update", "edit", "modify"],
      description: "Updates an existing message in a Slack channel.",
      stem: "update"
    }
  ],
  stem: "slack",
  alias: "updateSlackMessage",
  tags: ["slack", "update", "messages", "channel"],
  runat: "server",
  roles: ["USER"],
  icon: "edit",
  tools: [
    {
      type: "function",
      function: {
        name: "updateSlackMessage",
        description: "Update an existing message in a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            messageTs: { type: "string", description: "The timestamp of the message to update." },
            newText: { type: "string", description: "The new message content." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)."},
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'json'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "json"
            }
          },
          required: ["channelId", "messageTs", "newText"]
        }
      }
    }
  ]
};

/**
 * Macro to delete a message from a Slack channel
 */
export const SlackDeleteMessage: Macro<any, {
  channelId: string; messageTs: string; botToken?: string; format?: string;
}> = async (
  props,
  state,
  context
) => {
  const { channelId, messageTs, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'deleteSlackMessage', 
      params: props,
      instructions: `## Delete Slack Message — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackWriter = context.getService<SlackWriterService>("slack.SlackWriterService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const deleted = await slackWriter.deleteMessage(channelId, messageTs);
    let output;
    switch (format) {
      case 'markdown':
        output = deleted ? `✅ Message deleted from channel **${channelId}**\n\n- Deleted timestamp: ${messageTs}` : `❌ Failed to delete message`;
        break;
      case 'html':
        output = deleted ? `<div>✅ Message deleted from channel <b>${channelId}</b></div><p>Deleted timestamp: ${messageTs}</p>` : `<div>❌ Failed to delete message</div>`;
        break;
      case 'csv':
        output = deleted ? `deleted,channelId,messageTs\n${deleted},${channelId},${messageTs}` : `deleted,error\n${deleted},`;
        break;
      default:
        output = deleted;
    }
    return { success: true, data: output, tool: 'deleteSlackMessage', params: props, format,
      instructions: `## Slack Message Delete — Channel ${channelId}\n\nMessage deleted successfully in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` to verify the message is gone\n- Use \`writeSlackMessage\` to send a replacement message`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'deleteSlackMessage', params: props,
      instructions: `## Delete Slack Message — Error\n\nFailed to delete message in channel ${channelId} with timestamp ${messageTs}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify the channelId and messageTs are correct\n- Use \`readSlackMessages\` to find valid message timestamps\n- Check bot token permissions (chat:write scope required)`
    };
  }
};

export const SlackDeleteMessageRegistry: MacroComponentDefinition<typeof SlackDeleteMessage> = {
  nameSpace: "slack-macros",
  name: "deleteSlackMessage",
  version: "1.0.0",
  component: SlackDeleteMessage,
  description: `# deleteSlackMessage macro\nDelete a message from a Slack channel.\n\n## Usage\n@deleteSlackMessage(channelId, messageTs, botToken?, format?) - deletes the message with the specified timestamp.`,
  features: [
    {
      feature: "delete",
      featureType: Reactory.FeatureType.function,
      action: ["delete", "remove", "purge"],
      description: "Deletes a message from a Slack channel.",
      stem: "delete"
    }
  ],
  stem: "slack",
  alias: "deleteSlackMessage",
  tags: ["slack", "delete", "messages", "channel"],
  runat: "server",
  roles: ["USER"],
  icon: "trash",
  tools: [
    {
      type: "function",
      function: {
        name: "deleteSlackMessage",
        description: "Delete a message from a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            messageTs: { type: "string", description: "The timestamp of the message to delete." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)."},
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'json'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "json"
            }
          },
          required: ["channelId", "messageTs"]
        }
      }
    }
  ]
};

/**
 * Macro to add a reaction to a message in a Slack channel
 */
export const SlackAddReaction: Macro<any, {
  channelId: string; messageTs: string; reaction: string; botToken?: string; format?: string;
}> = async (
  props,
  state,
  context
) => {
  const { channelId, messageTs, reaction, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'addSlackReaction', 
      params: props,
      instructions: `## Add Slack Reaction — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackWriter = context.getService<SlackWriterService>("slack.SlackWriterService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const added = await slackWriter.addReaction(channelId, messageTs, reaction);
    let output;
    switch (format) {
      case 'markdown':
        output = added ? `✅ Reaction ":${reaction}:" added to message in channel **${channelId}**\n\n- Message timestamp: ${messageTs}` : `❌ Failed to add reaction`;
        break;
      case 'html':
        output = added ? `<div>✅ Reaction ":${reaction}:" added to message in channel <b>${channelId}</b></div><p>Message timestamp: ${messageTs}</p>` : `<div>❌ Failed to add reaction</div>`;
        break;
      case 'csv':
        output = added ? `added,channelId,messageTs,reaction\n${added},${channelId},${messageTs},${reaction}` : `added,error\n${added},`;
        break;
      default:
        output = added;
    }
    return { success: true, data: output, tool: 'addSlackReaction', params: props, format,
      instructions: `## Slack Reaction — Channel ${channelId}\n\nReaction added successfully in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` to view the message with the reaction\n- Use \`writeSlackMessage\` to send a new message\n- Use \`deleteSlackMessage\` to remove the message`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'addSlackReaction', params: props,
      instructions: `## Add Slack Reaction — Error\n\nFailed to add reaction to message in channel ${channelId} with timestamp ${messageTs}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify the channelId and messageTs are correct\n- Use \`readSlackMessages\` to find valid message timestamps\n- Check bot token permissions (reactions:write scope required)`
    };
  }
};

export const SlackAddReactionRegistry: MacroComponentDefinition<typeof SlackAddReaction> = {
  nameSpace: "slack-macros",
  name: "addSlackReaction",
  version: "1.0.0",
  component: SlackAddReaction,
  description: `# addSlackReaction macro\nAdd an emoji reaction to a message in a Slack channel.\n\n## Usage\n@addSlackReaction(channelId, messageTs, reaction, botToken?, format?) - adds the specified reaction to the message.`,
  features: [
    {
      feature: "react",
      featureType: Reactory.FeatureType.function,
      action: ["react", "addReaction", "emoji"],
      description: "Adds an emoji reaction to a message in a Slack channel.",
      stem: "react"
    }
  ],
  stem: "slack",
  alias: "addSlackReaction",
  tags: ["slack", "react", "reactions", "messages", "channel"],
  runat: "server",
  roles: ["USER"],
  icon: "emoji_events",
  tools: [
    {
      type: "function",
      function: {
        name: "addSlackReaction",
        description: "Add an emoji reaction to a message in a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            messageTs: { type: "string", description: "The timestamp of the message to react to." },
            reaction: { type: "string", description: "The emoji reaction to add (without colons, e.g., 'thumbsup', 'heart')." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)."},
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'json'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "json"
            }
          },
          required: ["channelId", "messageTs", "reaction"]
        }
      }
    }
  ]
};

/**
 * Macro to join a Slack channel
 */
export const SlackJoinChannel: Macro<any, {
  channelId: string; botToken?: string; format?: string;
}> = async (
  props,
  state,
  context
) => {
  const { channelId, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'joinSlackChannel', 
      params: props,
      instructions: `## Join Slack Channel — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackWriter = context.getService<SlackWriterService>("slack.SlackWriterService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const joined = await slackWriter.joinChannel(channelId);
    let output;
    switch (format) {
      case 'markdown':
        output = joined ? `✅ Successfully joined Slack channel **${channelId}**` : `❌ Failed to join channel`;
        break;
      case 'html':
        output = joined ? `<div>✅ Successfully joined Slack channel <b>${channelId}</b></div>` : `<div>❌ Failed to join channel</div>`;
        break;
      case 'csv':
        output = joined ? `joined,channelId\n${joined},${channelId}` : `joined,error\n${joined},`;
        break;
      default:
        output = joined;
    }
    return { success: true, data: output, tool: 'joinSlackChannel', params: props, format,
      instructions: `## Slack Channel Join — ${channelId}\n\nChannel joined successfully in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` to read messages in the channel\n- Use \`getSlackChannelInfo\` to get channel details\n- Use \`writeSlackMessage\` to send a message`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'joinSlackChannel', params: props,
      instructions: `## Join Slack Channel — Error\n\nFailed to join channel ${channelId}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify the channelId is correct using \`listSlackChannels\`\n- Check bot token permissions (channels:join scope required)\n- Ensure the channel is a public channel or bot has access to private channels`
    };
  }
};

export const SlackJoinChannelRegistry: MacroComponentDefinition<typeof SlackJoinChannel> = {
  nameSpace: "slack-macros",
  name: "joinSlackChannel",
  version: "1.0.0",
  component: SlackJoinChannel,
  description: `# joinSlackChannel macro\nJoin a Slack channel.\n\n## Usage\n@joinSlackChannel(channelId, botToken?, format?) - joins the specified Slack channel.`,
  features: [
    {
      feature: "join",
      featureType: Reactory.FeatureType.function,
      action: ["join", "enter", "access"],
      description: "Joins a Slack channel.",
      stem: "join"
    }
  ],
  stem: "slack",
  alias: "joinSlackChannel",
  tags: ["slack", "join", "channels"],
  runat: "server",
  roles: ["USER"],
  icon: "add",
  tools: [
    {
      type: "function",
      function: {
        name: "joinSlackChannel",
        description: "Join a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel to join." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)."},
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'json'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "json"
            }
          },
          required: ["channelId"]
        }
      }
    }
  ]
};
