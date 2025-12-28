// This file contains DTOs and service interfaces for the reactory-slack module.
export interface SlackBlock {
  type: string;
  block_id?: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
  };
  
}
export interface SlackMessage {
  id: string;
  app_id?: string;
  blocks?: any[];
  bot_id?: string;
  bot_profile?: string;
  is_locked?: boolean;
  latest_reply?: string;
  reply_users?: string[];
  reply_users_count?: number;
  replies?: { user: string; ts: string }[];
  reactions?: { name: string; count: number, users: string[] }[];
  text: string;
  username: string;
  timestamp?: string;
  ts?: string;  
  thread_ts?: string;
  reply_count?: number;
  type?: string;
  subtype?: string;
  subscribed?: boolean;
}

export interface SlackMessageFilter {
 // The filter can be passed as a predicate function to filter messages
 predicate?: (message: SlackMessage) => boolean;
 // The filter can be passed as a partial SlackMessage to match against
 message?: Partial<SlackMessage>;
}


export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

export interface SlackService {
  readMessages(channelId: string, limit?: number): Promise<SlackMessage[]>;
  writeMessage(channelId: string, message: string): Promise<boolean>;
  searchMessages(query: string, channelId?: string): Promise<SlackMessage[]>;
  joinChannel(channelId: string): Promise<boolean>;
}
