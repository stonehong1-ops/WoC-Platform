import { groupCrudService, GROUPS_COLLECTION } from './groupCrudService';
import { groupMemberService } from './groupMemberService';
import { groupPostService } from './groupPostService';
import { groupClassService } from './groupClassService';

export { GROUPS_COLLECTION };

export const groupService = {
  ...groupCrudService,
  ...groupMemberService,
  ...groupPostService,
  ...groupClassService
};
export default groupService;
