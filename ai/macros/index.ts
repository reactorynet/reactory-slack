import {
 SlackGetChannelInfoRegistry,
 SlackListChannelsRegistry,
 SlackReadMessagesRegistry,
 SlackReadThreadRepliesRegistry,
} from './SlackReaderMacros';

import { SlackWriteMessageRegistry } from './SlackWriterMacros';

export default [
 SlackGetChannelInfoRegistry,
 SlackListChannelsRegistry,
 SlackReadMessagesRegistry,
 SlackReadThreadRepliesRegistry,
 SlackWriteMessageRegistry,
]