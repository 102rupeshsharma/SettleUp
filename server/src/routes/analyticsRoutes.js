import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { isGroupMember } from '../middleware/roleMiddleware.js';
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  getUserOverview,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/groups/:id/analytics/category-breakdown', isAuthenticated, isGroupMember, getCategoryBreakdown);
router.get('/groups/:id/analytics/monthly-trend', isAuthenticated, isGroupMember, getMonthlyTrend);
router.get('/users/me/analytics/overview', isAuthenticated, getUserOverview);

export default router;
