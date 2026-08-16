import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', isAuthenticated, getNotifications);
router.put('/notifications/:id/read', isAuthenticated, markNotificationAsRead);
router.put('/notifications/read-all', isAuthenticated, markAllAsRead);

export default router;
