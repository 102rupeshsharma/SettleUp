import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { simplifyDebts } from '../services/debtSimplifier.js';
import { emitSettlementMade } from '../sockets/socketEvents.js';
import { sendEmail } from '../utils/sendEmail.js';

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

const calculateNets = async (group) => {
  const expenses = await Expense.find({ groupId: group._id });
  const settlements = await Settlement.find({ groupId: group._id });

  const nets = {};
  group.members.forEach((m) => {
    const uId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
    nets[uId] = 0;
  });

  /*
   * Sign Convention Explanation:
   * 1. Expenses:
   *    - paidBy: net += amount (they paid the bill, meaning they are owed this total back)
   *    - split.userId: net -= amount (they shared the cost, meaning they owe this share)
   * 2. Settlements:
   *    - fromUser: net += amount (they paid cash to resolve debt; increases net back up to zero)
   *    - toUser: net -= amount (they received cash; reduces their overall credit back down to zero)
   */
  expenses.forEach((expense) => {
    const payer = expense.paidBy.toString();
    if (nets[payer] !== undefined) {
      nets[payer] += expense.amount;
    }
    expense.splits.forEach((split) => {
      const splitUser = split.userId.toString();
      if (nets[splitUser] !== undefined) {
        nets[splitUser] -= split.amount;
      }
    });
  });

  settlements.forEach((settlement) => {
    const payer = settlement.fromUser.toString();
    const receiver = settlement.toUser.toString();

    if (nets[payer] !== undefined) {
      nets[payer] += settlement.amount;
    }
    if (nets[receiver] !== undefined) {
      nets[receiver] -= settlement.amount;
    }
  });

  return nets;
};

export const getBalances = async (req, res, next) => {
  try {
    const populatedGroup = await req.group.populate('members.userId', 'name email avatar');
    const nets = await calculateNets(populatedGroup);

    const balances = populatedGroup.members.map((m) => {
      const userObj = m.userId;
      const uId = userObj._id.toString();
      return {
        userId: uId,
        name: userObj.name,
        email: userObj.email,
        avatar: userObj.avatar,
        net: parseFloat((nets[uId] || 0).toFixed(2)),
      };
    });

    res.status(200).json(balances);
  } catch (error) {
    next(error);
  }
};

export const getSuggestedSettlements = async (req, res, next) => {
  try {
    const populatedGroup = await req.group.populate('members.userId', 'name email avatar');
    const nets = await calculateNets(populatedGroup);

    const balances = populatedGroup.members.map((m) => {
      const uId = m.userId._id.toString();
      return {
        userId: uId,
        net: nets[uId] || 0,
      };
    });

    const transactions = simplifyDebts(balances);

    const suggested = transactions.map((t) => {
      const fromMember = populatedGroup.members.find(
        (m) => m.userId._id.toString() === t.from
      );
      const toMember = populatedGroup.members.find(
        (m) => m.userId._id.toString() === t.to
      );

      return {
        fromUser: {
          _id: fromMember?.userId?._id,
          name: fromMember?.userId?.name,
          email: fromMember?.userId?.email,
          avatar: fromMember?.userId?.avatar,
        },
        toUser: {
          _id: toMember?.userId?._id,
          name: toMember?.userId?.name,
          email: toMember?.userId?.email,
          avatar: toMember?.userId?.avatar,
        },
        amount: t.amount,
      };
    });

    res.status(200).json(suggested);
  } catch (error) {
    next(error);
  }
};

export const settleUp = async (req, res, next) => {
  try {
    const { toUser, amount, method } = req.body;
    if (!toUser || !amount) {
      return res.status(400).json({ message: 'toUser and amount are required' });
    }

    const recipient = await User.findById(toUser);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    const settlement = await Settlement.create({
      groupId: req.group._id,
      fromUser: req.user._id,
      toUser,
      amount,
      method,
    });

    const populatedSettlement = await settlement.populate([
      { path: 'fromUser', select: 'name email avatar' },
      { path: 'toUser', select: 'name email avatar' },
    ]);

    await notifyGroup(
      req.group,
      'settlement_made',
      `${req.user.name} paid ${recipient.name} ${amount} via ${method}`,
      req.user._id
    );

    await Notification.create({
      userId: toUser,
      type: 'settlement_made',
      message: `${req.user.name} settled a debt of ${amount} with you in ${req.group.name}`,
      groupId: req.group._id,
    });

    emitSettlementMade(req.group._id, populatedSettlement);

    const emailHtml = `
      <h1>Debt Settled in SettleUp</h1>
      <p>Hello ${recipient.name},</p>
      <p>${req.user.name} has registered a payment to settle a debt with you in group <strong>${req.group.name}</strong>.</p>
      <ul>
        <li><strong>Paid By:</strong> ${req.user.name} (${req.user.email})</li>
        <li><strong>Amount:</strong> ${amount}</li>
        <li><strong>Payment Method:</strong> ${method}</li>
      </ul>
      <p>Check SettleUp to view your updated balance ledger.</p>
    `;
    sendEmail({
      to: recipient.email,
      subject: `SettleUp - Debt Settled by ${req.user.name}`,
      html: emailHtml,
    }).catch((err) => {
      console.error(err);
    });

    res.status(201).json(populatedSettlement);
  } catch (error) {
    next(error);
  }
};

export const listSettlements = async (req, res, next) => {
  try {
    const settlements = await Settlement.find({ groupId: req.group._id })
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .sort({ settledAt: -1 });

    res.status(200).json(settlements);
  } catch (error) {
    next(error);
  }
};
