import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock service ──────────────────────────────────────────────────────────────

const mockSlackWriterSvc = {
  writeMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  addReaction: jest.fn(),
  joinChannel: jest.fn(),
};

jest.mock('@reactory/server-core/logging', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    context: {
      getService: jest.fn((fqn: string) => {
        if (fqn === 'slack.SlackWriterService@1.0.0') return mockSlackWriterSvc;
        return undefined;
      }),
    } as unknown as Reactory.Server.IReactoryContext,
    user: { id: 'user-123' } as unknown as Reactory.Models.IUserDocument,
    vars: {},
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Slack Writer Macros', () => {
  let macros: typeof import('../ai/macros/SlackWriterMacros');

  beforeEach(async () => {
    


    jest.clearAllMocks();
  });

  // ── SlackWriteMessage ─────────────────────────────────────────────────────

  describe('SlackWriteMessage', () => {
    it('exports a registry with correct name and tool name', () => {
      const { SlackWriteMessageRegistry } = macros;
      expect(SlackWriteMessageRegistry.name).toBe('writeSlackMessage');
      expect(SlackWriteMessageRegistry.tools?.[0].function.name).toBe('writeSlackMessage');
    });

    it('exports a component function', () => {
      const { SlackWriteMessage } = macros;
      expect(typeof SlackWriteMessage).toBe('function');
    });

    it('sends a message to a channel on success', async () => {
      mockSlackWriterSvc.writeMessage.mockResolvedValue({ ok: true, ts: '1234567890.123', channel: 'C123' });
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C123', message: 'Hello' },
        state,
      );
      expect(result.success).toBe(true);
      expect(result.data).toContain('✅');
      expect(result.data).toContain('C123');
      expect(result.data).toContain('1234567890.123');
    });

    it('sends a threaded message when threadTs is provided', async () => {
      mockSlackWriterSvc.writeMessage.mockResolvedValue({ ok: true, ts: '1234567890.123', channel: 'C123' });
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C123', message: 'Hello', threadTs: '1234567890.123' },
        state,
      );
      expect(result.success).toBe(true);
      expect(result.instructions).toContain('Thread: 1234567890.123');
    });

    it('returns error when botToken is missing and SLACK_BOT_TOKEN is not set', async () => {
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C123', message: 'Hello' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid Slack bot token');
    });

    it('returns error when botToken is invalid', async () => {
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C123', message: 'Hello', botToken: 'invalid-token' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid Slack bot token');
    });

    it('returns error when API call fails', async () => {
      mockSlackWriterSvc.writeMessage.mockRejectedValue(new Error('channel not found'));
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C999', message: 'Hello' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('channel not found');
    });

    it('returns error when API returns non-ok response', async () => {
      mockSlackWriterSvc.writeMessage.mockResolvedValue({ ok: false, error: 'channel_not_found' });
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C999', message: 'Hello' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('channel_not_found');
    });

    it('returns error when service is unavailable', async () => {
      const state = makeState({ context: { getService: jest.fn(() => undefined) } as unknown as Reactory.Server.IReactoryContext });
      const result = await macros.SlackWriteMessage(
        { channelId: 'C123', message: 'Hello' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('instructions mention next steps', async () => {
      mockSlackWriterSvc.writeMessage.mockResolvedValue({ ok: true, ts: '1234567890.123', channel: 'C123' });
      const state = makeState();
      const result = await macros.SlackWriteMessage(
        { channelId: 'C123', message: 'Hello' },
        state,
      );
      expect(result.instructions).toContain('updateSlackMessage');
      expect(result.instructions).toContain('deleteSlackMessage');
      expect(result.instructions).toContain('addSlackReaction');
    });
  });

  // ── SlackUpdateMessage ─────────────────────────────────────────────────────

  describe('SlackUpdateMessage', () => {
    it('exports a registry with correct name and tool name', () => {
      const { SlackUpdateMessageRegistry } = macros;
      expect(SlackUpdateMessageRegistry.name).toBe('updateSlackMessage');
      expect(SlackUpdateMessageRegistry.tools?.[0].function.name).toBe('updateSlackMessage');
    });

    it('exports a component function', () => {
      const { SlackUpdateMessage } = macros;
      expect(typeof SlackUpdateMessage).toBe('function');
    });

    it('updates a message on success', async () => {
      mockSlackWriterSvc.updateMessage.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackUpdateMessage(
        { channelId: 'C123', messageTs: '1234567890.123', newText: 'Updated' },
        state,
      );
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns error when botToken is missing', async () => {
      const state = makeState();
      const result = await macros.SlackUpdateMessage(
        { channelId: 'C123', messageTs: '1234567890.123', newText: 'Updated' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid Slack bot token');
    });

    it('returns error when API call fails', async () => {
      mockSlackWriterSvc.updateMessage.mockRejectedValue(new Error('message not found'));
      const state = makeState();
      const result = await macros.SlackUpdateMessage(
        { channelId: 'C123', messageTs: 'invalid', newText: 'Updated' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('message not found');
    });

    it('returns error when service is unavailable', async () => {
      const state = makeState({ context: { getService: jest.fn(() => undefined) } as unknown as Reactory.Server.IReactoryContext });
      const result = await macros.SlackUpdateMessage(
        { channelId: 'C123', messageTs: '1234567890.123', newText: 'Updated' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('instructions mention next steps', async () => {
      mockSlackWriterSvc.updateMessage.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackUpdateMessage(
        { channelId: 'C123', messageTs: '1234567890.123', newText: 'Updated' },
        state,
      );
      expect(result.instructions).toContain('readSlackMessages');
      expect(result.instructions).toContain('deleteSlackMessage');
      expect(result.instructions).toContain('addSlackReaction');
    });
  });

  // ── SlackDeleteMessage ─────────────────────────────────────────────────────

  describe('SlackDeleteMessage', () => {
    it('exports a registry with correct name and tool name', () => {
      const { SlackDeleteMessageRegistry } = macros;
      expect(SlackDeleteMessageRegistry.name).toBe('deleteSlackMessage');
      expect(SlackDeleteMessageRegistry.tools?.[0].function.name).toBe('deleteSlackMessage');
    });

    it('exports a component function', () => {
      const { SlackDeleteMessage } = macros;
      expect(typeof SlackDeleteMessage).toBe('function');
    });

    it('deletes a message on success', async () => {
      mockSlackWriterSvc.deleteMessage.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackDeleteMessage(
        { channelId: 'C123', messageTs: '1234567890.123' },
        state,
      );
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns error when botToken is missing', async () => {
      const state = makeState();
      const result = await macros.SlackDeleteMessage(
        { channelId: 'C123', messageTs: '1234567890.123' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid Slack bot token');
    });

    it('returns error when API call fails', async () => {
      mockSlackWriterSvc.deleteMessage.mockRejectedValue(new Error('message not found'));
      const state = makeState();
      const result = await macros.SlackDeleteMessage(
        { channelId: 'C123', messageTs: 'invalid' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('message not found');
    });

    it('returns error when service is unavailable', async () => {
      const state = makeState({ context: { getService: jest.fn(() => undefined) } as unknown as Reactory.Server.IReactoryContext });
      const result = await macros.SlackDeleteMessage(
        { channelId: 'C123', messageTs: '1234567890.123' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('instructions mention next steps', async () => {
      mockSlackWriterSvc.deleteMessage.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackDeleteMessage(
        { channelId: 'C123', messageTs: '1234567890.123' },
        state,
      );
      expect(result.instructions).toContain('readSlackMessages');
      expect(result.instructions).toContain('writeSlackMessage');
    });
  });

  // ── SlackAddReaction ───────────────────────────────────────────────────────

  describe('SlackAddReaction', () => {
    it('exports a registry with correct name and tool name', () => {
      const { SlackAddReactionRegistry } = macros;
      expect(SlackAddReactionRegistry.name).toBe('addSlackReaction');
      expect(SlackAddReactionRegistry.tools?.[0].function.name).toBe('addSlackReaction');
    });

    it('exports a component function', () => {
      const { SlackAddReaction } = macros;
      expect(typeof SlackAddReaction).toBe('function');
    });

    it('adds a reaction on success', async () => {
      mockSlackWriterSvc.addReaction.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackAddReaction(
        { channelId: 'C123', messageTs: '1234567890.123', reaction: 'thumbsup' },
        state,
      );
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns error when botToken is missing', async () => {
      const state = makeState();
      const result = await macros.SlackAddReaction(
        { channelId: 'C123', messageTs: '1234567890.123', reaction: 'thumbsup' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid Slack bot token');
    });

    it('returns error when API call fails', async () => {
      mockSlackWriterSvc.addReaction.mockRejectedValue(new Error('message not found'));
      const state = makeState();
      const result = await macros.SlackAddReaction(
        { channelId: 'C123', messageTs: 'invalid', reaction: 'thumbsup' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('message not found');
    });

    it('returns error when service is unavailable', async () => {
      const state = makeState({ context: { getService: jest.fn(() => undefined) } as unknown as Reactory.Server.IReactoryContext });
      const result = await macros.SlackAddReaction(
        { channelId: 'C123', messageTs: '1234567890.123', reaction: 'thumbsup' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('instructions mention next steps', async () => {
      mockSlackWriterSvc.addReaction.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackAddReaction(
        { channelId: 'C123', messageTs: '1234567890.123', reaction: 'thumbsup' },
        state,
      );
      expect(result.instructions).toContain('readSlackMessages');
      expect(result.instructions).toContain('writeSlackMessage');
      expect(result.instructions).toContain('deleteSlackMessage');
    });
  });

  // ── SlackJoinChannel ───────────────────────────────────────────────────────

  describe('SlackJoinChannel', () => {
    it('exports a registry with correct name and tool name', () => {
      const { SlackJoinChannelRegistry } = macros;
      expect(SlackJoinChannelRegistry.name).toBe('joinSlackChannel');
      expect(SlackJoinChannelRegistry.tools?.[0].function.name).toBe('joinSlackChannel');
    });

    it('exports a component function', () => {
      const { SlackJoinChannel } = macros;
      expect(typeof SlackJoinChannel).toBe('function');
    });

    it('joins a channel on success', async () => {
      mockSlackWriterSvc.joinChannel.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackJoinChannel(
        { channelId: 'C123' },
        state,
      );
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns error when botToken is missing', async () => {
      const state = makeState();
      const result = await macros.SlackJoinChannel(
        { channelId: 'C123' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid Slack bot token');
    });

    it('returns error when API call fails', async () => {
      mockSlackWriterSvc.joinChannel.mockRejectedValue(new Error('channel not found'));
      const state = makeState();
      const result = await macros.SlackJoinChannel(
        { channelId: 'C999' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('channel not found');
    });

    it('returns error when service is unavailable', async () => {
      const state = makeState({ context: { getService: jest.fn(() => undefined) } as unknown as Reactory.Server.IReactoryContext });
      const result = await macros.SlackJoinChannel(
        { channelId: 'C123' },
        state,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('instructions mention next steps', async () => {
      mockSlackWriterSvc.joinChannel.mockResolvedValue(true);
      const state = makeState();
      const result = await macros.SlackJoinChannel(
        { channelId: 'C123' },
        state,
      );
      expect(result.instructions).toContain('readSlackMessages');
      expect(result.instructions).toContain('getSlackChannelInfo');
      expect(result.instructions).toContain('writeSlackMessage');
    });
  });

  // ── Registry Array ─────────────────────────────────────────────────────────

  describe('SlackWriterMacros registry', () => {
    it('exports an array of 5 MacroComponentDefinitions', () => {
      const { SlackWriterMacros } = macros;
      expect(SlackWriterMacros).toHaveLength(5);
    });

    it('all macros have correct nameSpace', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.nameSpace).toBe('slack-macros');
      }
    });

    it('all macros have correct stem', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.stem).toBe('slack');
      }
    });

    it('all macros have correct runat', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.runat).toBe('server');
      }
    });

    it('all macros have correct roles', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.roles).toContain('USER');
      }
    });

    it('all macros have correct version', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.version).toBe('1.0.0');
      }
    });

    it('all macros have correct tags', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.tags).toContain('slack');
        expect(reg.tags).toContain('write');
      }
    });

    it('all macros have tools defined', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.tools).toBeDefined();
        expect(reg.tools?.length).toBeGreaterThan(0);
      }
    });

    it('all macros have features defined', () => {
      const { SlackWriterMacros } = macros;
      for (const reg of SlackWriterMacros) {
        expect(reg.features).toBeDefined();
        expect(reg.features?.length).toBeGreaterThan(0);
      }
    });

    it('all macros have correct icon', () => {
      const { SlackWriterMacros } = macros;
      const icons = ['send', 'edit', 'trash', 'emoji_events', 'add'];
      for (let i = 0; i < SlackWriterMacros.length; i++) {
        expect(icons[i]).toBe(SlackWriterMacros[i].icon);
      }
    });
  });
});
