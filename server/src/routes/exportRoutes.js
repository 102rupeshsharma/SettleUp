import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { isGroupMember } from '../middleware/roleMiddleware.js';
import { exportCSV, exportPDF } from '../controllers/exportController.js';

const router = express.Router();

router.get('/groups/:id/export/csv', isAuthenticated, isGroupMember, exportCSV);
router.get('/groups/:id/export/pdf', isAuthenticated, isGroupMember, exportPDF);

export default router;
