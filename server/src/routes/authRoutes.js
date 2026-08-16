import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

import { validateSignup, validateLogin } from '../middleware/validationMiddleware.js';

// Auth endpoints
router.post('/auth/signup', authLimiter, validateSignup, signup);
router.post('/auth/login', authLimiter, validateLogin, login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', logout);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password/:token', resetPassword);

// User profile endpoints
router.get('/users/me', isAuthenticated, getMe);
router.put('/users/me', isAuthenticated, updateMe);

export default router;
