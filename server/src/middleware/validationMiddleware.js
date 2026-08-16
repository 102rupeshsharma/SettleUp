import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

export const validateSignup = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateGroup = [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  handleValidationErrors,
];

export const validateExpense = [
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
  body('paidBy').isMongoId().withMessage('Provide a valid payer user ID'),
  body('splitType').isIn(['equal', 'exact', 'percentage']).withMessage('Invalid split type'),
  body('splits').isArray({ min: 1 }).withMessage('Provide at least one split details'),
  handleValidationErrors,
];

export const validateSettlement = [
  body('toUser').isMongoId().withMessage('Provide a valid recipient user ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
  body('method').optional().isIn(['cash', 'upi', 'bank', 'other']).withMessage('Invalid payment method'),
  handleValidationErrors,
];
