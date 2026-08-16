import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import {
  isGroupMember,
  isGroupAdmin,
} from '../middleware/roleMiddleware.js';
import {
  createGroup,
  listGroups,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  regenerateInviteCode,
  joinGroup,
  changeMemberRole,
  removeMember,
} from '../controllers/groupController.js';

import { validateGroup } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/groups', isAuthenticated, validateGroup, createGroup);
router.get('/groups', isAuthenticated, listGroups);
router.post('/groups/join/:inviteCode', isAuthenticated, joinGroup);

router.get('/groups/:id', isAuthenticated, isGroupMember, getGroupDetail);
router.put('/groups/:id', isAuthenticated, isGroupAdmin, validateGroup, updateGroup);
router.delete('/groups/:id', isAuthenticated, isGroupAdmin, deleteGroup);
router.post('/groups/:id/invite', isAuthenticated, isGroupAdmin, regenerateInviteCode);

router.put('/groups/:id/members/:userId/role', isAuthenticated, isGroupAdmin, changeMemberRole);
router.delete('/groups/:id/members/:userId', isAuthenticated, isGroupMember, removeMember);

export default router;
