import { Macro, MacroComponentDefinition, ChatState } from "@reactory/server-modules/reactory-reactor/ai/openai/types/chat";
import Reactory from "@reactorynet/reactory-core";
import SlackReaderService from "@reactory/server-modules/reactory-slack/services/SlackReaderService";

/**
 * Macro to read messages from a Slack channel
 */
export const SlackReadMessages: Macro<any, {
  channelId: string; limit?: number; oldest?: string; latest?: string; botToken?: string; format?: string;
}> = async (
  props,
  state,
  context
) => {
  const { channelId, limit = 100, oldest, latest, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'readSlackMessages', 
      params: props,
      instructions: `## Read Slack Messages — Authentication Error\n\nNo valid Slack bot token available. Checked provided botToken param and SLACK_BOT_TOKEN env var.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set\n- Use \`listSlackChannels\` to verify token validity first`
    };
  }
  
  const slackReader = context.getService<SlackReaderService>("slack.SlackReaderService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  // ensure we format the the oldest and lastest dates in slack seconds format
  const oldestDate = oldest ? Math.floor(new Date(oldest).getTime() / 1000).toString() : undefined;
  const latestDate = latest ? Math.floor(new Date(latest).getTime() / 1000).toString() : undefined;
  try {
    const messages = await slackReader.readMessages(channelId, limit, oldestDate, latestDate);
    let output;
    switch (format) {
      case 'markdown':
        output = messages.map(msg => `- [${msg.timestamp}] ${msg.user}: ${msg.text}`).join('\n');
        break;
      case 'html':
        output = messages.map(msg => `<li>[${msg.timestamp}] <b>${msg.user}</b>: ${msg.text}</li>`).join('');
        break;
      case 'csv':
        output = messages.map(msg => `${msg.timestamp},${msg.user},"${msg.text.replace(/"/g, '""')}"`).join('\n');
        break;
      default:
        output = messages;
    }
    const msgCount = Array.isArray(messages) ? messages.length : 0;
    return { success: true, data: output, tool: 'readSlackMessages', params: props, format,
      instructions: `## Slack Messages — Channel ${channelId}\n\nRetrieved **${msgCount}** message(s) in ${format} format.${oldest ? ` From: ${oldest}` : ''}${latest ? ` To: ${latest}` : ''}\n\n### Suggested Next Steps:\n- Use \`readSlackThreadReplies\` with a message timestamp to read thread replies\n- Use \`getSlackChannelInfo\` for channel details\n- Adjust limit/oldest/latest params for different time ranges`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'readSlackMessages', params: props,
      instructions: `## Read Slack Messages — Error\n\nFailed to read messages from channel ${channelId}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify the channelId is correct using \`listSlackChannels\`\n- Check bot token permissions (channels:history scope required)\n- Retry with a smaller limit or narrower time range`
    };
  }
};

export const SlackReadMessagesRegistry: MacroComponentDefinition<typeof SlackReadMessages> = {
  nameSpace: "slack-macros",
  name: "readSlackMessages",
  version: "1.0.0",
  component: SlackReadMessages,
  description: `# readSlackMessages macro\nRead messages from a Slack channel.\n\n## Usage\n@readSlackMessages(channelId, limit?, oldest?, latest?) - returns messages from the specified channel.`,
  features: [
    {
      feature: "read",
      featureType: Reactory.FeatureType.function,
      action: ["read", "fetch", "get"],
      description: "Reads messages from a Slack channel.",
      stem: "read"
    }
  ],
  stem: "slack",
  alias: "readSlackMessages",
  roles: ["USER"],
  icon: "message",
  tags: ["slack", "read", "messages", "channel"],
  runat: "server",
  roles: ["USER"],
  tools: [
    {
      type: "function",
      roles: ["USER"],
      function: {
        name: "readSlackMessages",
        icon: "message",
        description: "Read messages from a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            limit: { type: "number", description: "Maximum number of messages to fetch (optional)." },
            oldest: { type: "string", description: "Only messages after this timestamp (optional)." },
            latest: { type: "string", description: "Only messages before this timestamp (optional)." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)." },
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

/**
 * Macro to read replies to a Slack thread
 */
export const SlackReadThreadReplies: Macro<any, { channelId: string; threadTs: string; limit?: number; botToken?: string; format?: string }> = async (
  props,
  state,
  context
) => {
  const { channelId, threadTs, limit, botToken, format = 'json' } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'readSlackThreadReplies', 
      params: props,
      instructions: `## Read Thread Replies — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackReader = context.getService<SlackReaderService>("slack.SlackReaderService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const replies = await slackReader.readThreadReplies(channelId, threadTs, limit);
    let output;
    switch (format) {
      case 'markdown':
        output = replies.map(msg => `- [${msg.timestamp}] ${msg.user}: ${msg.text}`).join('\n');
        break;
      case 'html':
        output = replies.map(msg => `<li>[${msg.timestamp}] <b>${msg.user}</b>: ${msg.text}</li>`).join('');
        break;
      case 'csv':
        output = replies.map(msg => `${msg.timestamp},${msg.user},"${msg.text.replace(/"/g, '""')}"`).join('\n');
        break;
      default:
        output = replies;
    }
    const replyCount = Array.isArray(replies) ? replies.length : 0;
    return { success: true, data: output, tool: 'readSlackThreadReplies', params: props, format,
      instructions: `## Thread Replies — Channel ${channelId}, Thread ${threadTs}\n\nRetrieved **${replyCount}** reply/replies in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` to see other messages in the channel\n- Use \`getSlackChannelInfo\` for channel details`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'readSlackThreadReplies', params: props,
      instructions: `## Read Thread Replies — Error\n\nFailed to read thread replies: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify channelId and threadTs are correct\n- Use \`readSlackMessages\` to find valid thread timestamps\n- Check bot token permissions`
    };
  }
};

export const SlackReadThreadRepliesRegistry: MacroComponentDefinition<typeof SlackReadThreadReplies> = {
  nameSpace: "slack-macros",
  name: "readSlackThreadReplies",
  version: "1.0.0",
  component: SlackReadThreadReplies,
  description: `# readThreadReplies macro\nRead replies to a Slack thread.\n\n## Usage\n@readThreadReplies(channelId, threadTs, limit?) - returns replies to the specified thread.`,
  features: [
    {
      feature: "read",
      featureType: Reactory.FeatureType.function,
      action: ["read", "fetch", "get"],
      description: "Reads replies to a Slack thread.",
      stem: "read"
    }
  ],
  stem: "slack",
  alias: "readSlackThreadReplies",
  tags: ["slack", "read", "thread", "replies"],
  runat: "server",
  roles: ["USER"],
  icon: "message",  
  tools: [
    {
      type: "function",
      function: {
        name: "readSlackThreadReplies",
        description: "Read replies to a Slack thread.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            threadTs: { type: "string", description: "The timestamp of the parent message." },
            limit: { type: "number", description: "Maximum number of replies to fetch (optional)." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)." },
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'json'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "json"
            }
          },
          required: ["channelId", "threadTs"]
        }
      }
    }
  ]
};

/**
 * Macro to get Slack channel info
 */
export const SlackGetChannelInfo: Macro<any, { channelId: string; botToken?: string; format?: string }> = async (
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
      tool: 'getSlackChannelInfo', 
      params: props,
      instructions: `## Get Channel Info — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackReader = context.getService<SlackReaderService>("slack.SlackReaderService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const info = await slackReader.getChannelInfo(channelId);
    let output;
    switch (format) {
      case 'markdown':
        output = `# Channel: ${info.name}\nID: ${info.id}\nMembers: ${info.num_members}`;
        break;
      case 'html':
        output = `<h2>Channel: ${info.name}</h2><p>ID: ${info.id}</p><p>Members: ${info.num_members}</p>`;
        break;
      case 'csv':
        output = `id,name,num_members\n${info.id},${info.name},${info.num_members}`;
        break;
      default:
        output = info;
    }
    return { success: true, data: output, tool: 'getSlackChannelInfo', params: props, format,
      instructions: `## Channel Info — ${channelId}\n\nRetrieved channel information in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` with channelId="${channelId}" to read messages\n- Use \`listSlackChannels\` to browse other channels`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'getSlackChannelInfo', params: props,
      instructions: `## Get Channel Info — Error\n\nFailed to get info for channel ${channelId}: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Verify channelId using \`listSlackChannels\`\n- Check bot token permissions (channels:read scope required)`
    };
  }
};

export const SlackGetChannelInfoRegistry: MacroComponentDefinition<typeof SlackGetChannelInfo> = {
  nameSpace: "slack-macros",
  name: "getSlackChannelInfo",
  version: "1.0.0",
  component: SlackGetChannelInfo,
  description: `# getChannelInfo macro\nGet information about a Slack channel.\n\n## Usage\n@getChannelInfo(channelId) - returns channel information.`,
  features: [
    {
      feature: "info",
      featureType: Reactory.FeatureType.function,
      action: ["info", "get", "fetch"],
      description: "Gets information about a Slack channel.",
      stem: "info"
    }
  ],
  stem: "slack",
  alias: "getSlackChannelInfo",
  tags: ["slack", "channel", "info"],
  runat: "server",
  roles: ["USER"],
  tools: [
    {
      type: "function",
      function: {
        name: "getSlackChannelInfo",
        description: "Get information about a Slack channel.",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "The ID of the Slack channel." },
            botToken: { type: "string", description: "The bot token to use for authentication (optional)." },
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

/**
 * Macro to list Slack channels
 */
export const SlackListChannels: Macro<any, { types?: string; limit?: number; format?: string; botToken?: string }> = async (
  props,
  state,
  context
) => {
  const { types = 'public_channel', limit = 100, format = 'markdown', botToken } = props;
  
  // Validate botToken - ensure it's not null, undefined, or empty string
  const validBotToken = botToken && botToken.trim() !== '' ? botToken : process.env.SLACK_BOT_TOKEN;
  if (!validBotToken || validBotToken.trim() === '') {
    return { 
      success: false, 
      error: 'Missing or invalid Slack bot token. Please provide a valid bot token.', 
      tool: 'listSlackChannels', 
      params: props,
      instructions: `## List Channels — Authentication Error\n\nNo valid Slack bot token available.\n\n### Recovery Options:\n- Provide a valid botToken parameter\n- Ensure SLACK_BOT_TOKEN environment variable is set`
    };
  }
  
  const slackReader = context.getService<SlackReaderService>("slack.SlackReaderService@1.0.0", {
    SLACK_BOT_TOKEN: validBotToken
  });
  try {
    const channels = await slackReader.listChannels(types, limit);
    let output;
    switch (format) {
      case 'markdown':
        output = channels.map(channel => `- ${channel.name} (${channel.id})`).join('\n');
        break;
      case 'html':
        output = channels.map(channel => `<li>${channel.name} (${channel.id})</li>`).join('');
        break;
      case 'csv':
        output = channels.map(channel => `${channel.name},${channel.id}`).join('\n');
        break;
      default:
        output = channels;
    }
    const channelCount = Array.isArray(channels) ? channels.length : 0;
    return { success: true, data: output, tool: 'listSlackChannels', params: props, format,
      instructions: `## Slack Channels\n\nListed **${channelCount}** channel(s) of type "${types}" in ${format} format.\n\n### Suggested Next Steps:\n- Use \`readSlackMessages\` with a channelId to read messages\n- Use \`getSlackChannelInfo\` with a channelId for channel details\n- Adjust types param (public_channel, private_channel, mpim, im) for different channel types`
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), tool: 'listSlackChannels', params: props,
      instructions: `## List Channels — Error\n\nFailed to list channels: ${err instanceof Error ? err.message : String(err)}\n\n### Recovery Options:\n- Check bot token permissions (channels:read scope required)\n- Reduce the limit parameter\n- Verify the types parameter is valid`
    };
  }
};

export const SlackListChannelsRegistry: MacroComponentDefinition<typeof SlackListChannels> = {
  nameSpace: "slack-macros",
  name: "listSlackChannels",
  version: "1.0.0",
  component: SlackListChannels,
  description: `# listSlackChannels macro\nList Slack channels.\n\n## Usage\n@listSlackChannels(types?, limit?, format?, token?) - returns a list of channels.`,
  features: [
    {
      feature: "list",
      featureType: Reactory.FeatureType.function,
      action: ["list", "fetch", "get"],
      description: "Lists Slack channels.",
      stem: "list"
    }
  ],
  stem: "slack",
  alias: "listSlackChannels",
  tags: ["slack", "channels", "list"],
  runat: "server",
  roles: ["USER"],
  tools: [
    {
      type: "function",
      function: {
        name: "listSlackChannels",
        description: "List Slack channels. There are no required parameters, but you can specify types, limit, format, and botToken. Defaults exist for certain parameters.",
        parameters: {
          type: "object",
          properties: {
            types: { type: "string", description: "Comma-separated list of channel types (optional). Defaults to 'public_channel'. Use 'public_channel,private_channel' if you have both scopes." },
            limit: { type: "number", description: "Maximum number of channels to fetch (optional)." },
            format: {
              type: "string",
              description: "Format of the output (optional). Defaults to 'markdown'.",
              enum: ["markdown", "html", "csv", "json"],
              default: "markdown"
            },
            botToken: { 
              type: "string", 
              description: `The bot token to use for authentication (optional) - A default is provided at runtime.` 
            }
          },
          required: []
        }
      }
    }
  ]
};
