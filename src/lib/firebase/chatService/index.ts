import { chatRoomService, GLOBAL_LOUNGE_ID, SYSTEM_NOTICE_ID } from './chatRoomService';
import { chatMessageService } from './chatMessageService';
import { chatMediaService } from './chatMediaService';
import { chatSyncService } from './chatSyncService';

export { GLOBAL_LOUNGE_ID, SYSTEM_NOTICE_ID };

export const chatService = {
  ...chatRoomService,
  ...chatMessageService,
  ...chatMediaService,
  ...chatSyncService
};
export default chatService;
