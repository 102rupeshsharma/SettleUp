import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import {
  emitExpenseAdded,
  emitExpenseUpdated,
  emitExpenseDeleted,
} from '../sockets/socketEvents.js';
import { logActivity } from '../services/activityLog.js';
import { formatMoney } from '../utils/formatMoney.js';

const notifyGroup = async (group, type, message, excludeUserId) => {
  try {
    const notifications = group.members
      .filter((m) => m.userId.toString() !== excludeUserId.toString())
      .map((m) => ({
        userId: m.userId,
        type,
        message,
        groupId: group._id,
      }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error(err);
  }
};

const round2 = (value) => parseFloat(Number(value).toFixed(2));

const idOf = (userId) => (userId && userId._id ? userId._id : userId);

/*
 * Turns what the client sent into the splits stored on the expense.
 *
 * - equal:      shared equally between the people listed in `splits`, or
 *               between every member when no list is given.
 * - percentage: each listed person's percentage of the total.
 * - shares:     proportional to each listed person's share count (2:1:1).
 * - exact:      the amounts as given.
 *
 * People with a zero percentage, share or amount are left out. In every
 * computed mode the last person absorbs the rounding remainder so the parts
 * always add up to the total.
 */
const buildSplits = (group, amount, splitType, splits) => {
  const given = Array.isArray(splits) ? splits : [];

  if (splitType === 'equal') {
    const seen = new Set();
    let participantIds = [];
    given.forEach((s) => {
      const id = idOf(s.userId);
      if (id && !seen.has(id.toString())) {
        seen.add(id.toString());
        participantIds.push(id);
      }
    });
    if (participantIds.length === 0) {
      participantIds = group.members.map((m) => m.userId);
    }

    const count = participantIds.length;
    const equalAmount = round2(amount / count);
    let sum = 0;

    return participantIds.map((userId, idx) => {
      let userAmount = equalAmount;
      if (idx === count - 1) {
        userAmount = round2(amount - sum);
      }
      sum += userAmount;
      return { userId, amount: userAmount };
    });
  }

  if (splitType === 'percentage') {
    const parts = given.filter((s) => Number(s.percentage) > 0);
    const count = parts.length;
    let sum = 0;

    return parts.map((s, idx) => {
      const percentage = Number(s.percentage);
      let userAmount = round2(amount * (percentage / 100));
      if (idx === count - 1) {
        userAmount = round2(amount - sum);
      }
      sum += userAmount;
      return { userId: idOf(s.userId), amount: userAmount, percentage };
    });
  }

  if (splitType === 'shares') {
    const parts = given.filter((s) => Number(s.shares) > 0);
    const totalShares = parts.reduce((acc, s) => acc + Number(s.shares), 0);
    const count = parts.length;
    let sum = 0;

    return parts.map((s, idx) => {
      const shares = Number(s.shares);
      let userAmount = round2((amount * shares) / totalShares);
      if (idx === count - 1) {
        userAmount = round2(amount - sum);
      }
      sum += userAmount;
      return { userId: idOf(s.userId), amount: userAmount, shares };
    });
  }

  return given
    .filter((s) => Number(s.amount) > 0)
    .map((s) => ({
      userId: idOf(s.userId),
      amount: round2(s.amount),
    }));
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const spentOn = (expense) => expense.date || expense.createdAt;

export const createExpense = async (req, res, next) => {
  try {
    if (req.memberRole === 'viewer') {
      return res.status(403).json({ message: 'Access denied: viewers cannot add expenses' });
    }

    const { description, amount, category, paidBy, splitType, splits, receiptUrl, date } = req.body;
    if (!description || !amount || !paidBy || !splitType) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const finalSplits = buildSplits(req.group, amount, splitType, splits);
    if (finalSplits.length === 0) {
      return res.status(400).json({ message: 'Choose at least one person to split this expense with' });
    }

    const expense = await Expense.create({
      groupId: req.group._id,
      description,
      amount,
      category,
      paidBy,
      splitType,
      splits: finalSplits,
      receiptUrl,
      date: parseDate(date) || new Date(),
      createdBy: req.user._id,
    });

    const populatedExpense = await expense.populate([
      { path: 'paidBy', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);

    const money = formatMoney(amount, req.group.currency);

    await notifyGroup(
      req.group,
      'expense_added',
      `${req.user.name} added "${description}" (${money}) in ${req.group.name}`,
      req.user._id
    );

    await logActivity(req.group._id, req.user._id, 'expense_added', `added "${description}" (${money})`);

    emitExpenseAdded(req.group._id, populatedExpense, req.group.currency);

    res.status(201).json(populatedExpense);
  } catch (error) {
    next(error);
  }
};

export const listExpenses = async (req, res, next) => {
  try {
    const { category, search, from, to } = req.query;
    const query = { groupId: req.group._id };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    // Newest spend first. Sorted here rather than in the query because older
    // expenses have no `date` and must fall back to createdAt.
    expenses.sort((a, b) => new Date(spentOn(b)) - new Date(spentOn(a)));

    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (req.memberRole === 'viewer') {
      return res.status(403).json({ message: 'Access denied: viewers cannot update expenses' });
    }

    const isCreator = expense.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.memberRole === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: only the creator or group admins can edit this expense' });
    }

    const { description, amount, category, paidBy, splitType, splits, receiptUrl, date } = req.body;
    const previousAmount = expense.amount;

    if (description !== undefined) expense.description = description;
    if (category !== undefined) expense.category = category;
    if (paidBy !== undefined) expense.paidBy = paidBy;
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;

    const parsedDate = parseDate(date);
    if (parsedDate) expense.date = parsedDate;

    if (amount !== undefined || splitType !== undefined || splits !== undefined) {
      const finalAmount = amount !== undefined ? amount : expense.amount;
      const finalSplitType = splitType !== undefined ? splitType : expense.splitType;
      const rawSplits = splits !== undefined ? splits : expense.splits;

      const finalSplits = buildSplits(req.group, finalAmount, finalSplitType, rawSplits);
      if (finalSplits.length === 0) {
        return res.status(400).json({ message: 'Choose at least one person to split this expense with' });
      }

      expense.amount = finalAmount;
      expense.splitType = finalSplitType;
      expense.splits = finalSplits;
    }

    const updatedExpense = await expense.save();
    const populatedExpense = await updatedExpense.populate([
      { path: 'paidBy', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);

    await notifyGroup(
      req.group,
      'expense_added',
      `${req.user.name} updated expense "${populatedExpense.description}" in ${req.group.name}`,
      req.user._id
    );

    const amountChanged = Math.abs(previousAmount - populatedExpense.amount) > 0.005;
    await logActivity(
      req.group._id,
      req.user._id,
      'expense_updated',
      amountChanged
        ? `changed "${populatedExpense.description}" from ${formatMoney(previousAmount, req.group.currency)} to ${formatMoney(populatedExpense.amount, req.group.currency)}`
        : `edited "${populatedExpense.description}"`
    );

    emitExpenseUpdated(req.group._id, populatedExpense, req.group.currency);

    res.status(200).json(populatedExpense);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (req.memberRole === 'viewer') {
      return res.status(403).json({ message: 'Access denied: viewers cannot delete expenses' });
    }

    const isCreator = expense.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.memberRole === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: only the creator or group admins can delete this expense' });
    }

    await Expense.findByIdAndDelete(id);

    await notifyGroup(
      req.group,
      'expense_added',
      `${req.user.name} deleted expense "${expense.description}" in ${req.group.name}`,
      req.user._id
    );

    await logActivity(
      req.group._id,
      req.user._id,
      'expense_deleted',
      `deleted "${expense.description}" (${formatMoney(expense.amount, req.group.currency)})`
    );

    emitExpenseDeleted(req.group._id, id);

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadExpenseReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (req.memberRole === 'viewer') {
      return res.status(403).json({ message: 'Access denied: viewers cannot upload receipts' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No receipt file provided' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    expense.receiptUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    await expense.save();

    res.status(200).json(expense);
  } catch (error) {
    next(error);
  }
};
