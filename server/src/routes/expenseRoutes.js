import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { isGroupMember } from '../middleware/roleMiddleware.js';
import {
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
  uploadExpenseReceipt,
} from '../controllers/expenseController.js';
import { uploadReceipt } from '../middleware/uploadMiddleware.js';
import { validateExpense } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/groups/:id/expenses', isAuthenticated, isGroupMember, validateExpense, createExpense);
router.get('/groups/:id/expenses', isAuthenticated, isGroupMember, listExpenses);
router.put('/expenses/:id', isAuthenticated, isGroupMember, validateExpense, updateExpense);
router.delete('/expenses/:id', isAuthenticated, isGroupMember, deleteExpense);
router.post(
  '/expenses/:id/receipt',
  isAuthenticated,
  isGroupMember,
  uploadReceipt.single('receipt'),
  uploadExpenseReceipt
);

export default router;
