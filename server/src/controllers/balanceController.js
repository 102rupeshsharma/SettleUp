import Settlement from '../models/Settlement.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { simplifyDebts } from '../services/debtSimplifier.js';
import { calculateNets } from '../services/balances.js';
import { logActivity } from '../services/activityLog.js';
import { emitSettlementMade } from '../sockets/socketEvents.js';
import { sendEmail } from '../utils/sendEmail.js';
import { formatMoney } from '../utils/formatMoney.js';
import { env } from '../config/env.js';

const METHOD_LABELS = { cash: 'cash', upi: 'UPI', bank: 'bank transfer', other: 'other' };

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

    if (toUser.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot record a payment to yourself' });
    }

    const recipientIsMember = req.group.members.some(
      (m) => m.userId.toString() === toUser.toString()
    );
    if (!recipientIsMember) {
      return res.status(400).json({ message: 'That person is not a member of this group' });
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

    const money = formatMoney(amount, req.group.currency);
    const methodLabel = METHOD_LABELS[populatedSettlement.method] || populatedSettlement.method;

    await notifyGroup(
      req.group,
      'settlement_made',
      `${req.user.name} paid ${recipient.name} ${money} (${methodLabel})`,
      req.user._id
    );

    await Notification.create({
      userId: toUser,
      type: 'settlement_made',
      message: `${req.user.name} paid you ${money} in ${req.group.name}`,
      groupId: req.group._id,
    });

    await logActivity(req.group._id, req.user._id, 'settlement_made', `paid ${recipient.name} ${money}`);

    emitSettlementMade(req.group._id, populatedSettlement, req.group.currency);

    const emailHtml = `
      <h1>Debt Settled in SettleUp</h1>
      <p>Hello ${recipient.name},</p>
      <p>${req.user.name} has registered a payment to settle a debt with you in group <strong>${req.group.name}</strong>.</p>
      <ul>
        <li><strong>Paid By:</strong> ${req.user.name} (${req.user.email})</li>
        <li><strong>Amount:</strong> ${money}</li>
        <li><strong>Payment Method:</strong> ${methodLabel}</li>
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

const REMINDER_COOLDOWN_MS = 12 * 60 * 60 * 1000;

// Nudge someone who owes the caller money. Only allowed when the suggested
// payments actually include one from that person to the caller.
export const remindMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const populatedGroup = await req.group.populate('members.userId', 'name email avatar');
    const nets = await calculateNets(populatedGroup);
    const balances = populatedGroup.members.map((m) => {
      const uId = m.userId._id.toString();
      return { userId: uId, net: nets[uId] || 0 };
    });

    const owed = simplifyDebts(balances).find(
      (t) => t.from === userId && t.to === req.user._id.toString()
    );
    if (!owed) {
      return res.status(400).json({ message: 'This person does not owe you anything right now' });
    }

    const debtor = populatedGroup.members.find((m) => m.userId._id.toString() === userId)?.userId;
    const money = formatMoney(owed.amount, populatedGroup.currency);
    const message = `${req.user.name} sent a reminder: you owe them ${money} in ${populatedGroup.name}`;

    const recent = await Notification.findOne({
      userId,
      groupId: populatedGroup._id,
      type: 'payment_reminder',
      message: { $regex: `^${req.user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} sent a reminder` },
      createdAt: { $gt: new Date(Date.now() - REMINDER_COOLDOWN_MS) },
    });
    if (recent) {
      return res.status(429).json({ message: `You already reminded ${debtor.name} recently. Try again later.` });
    }

    await Notification.create({
      userId,
      type: 'payment_reminder',
      message,
      groupId: populatedGroup._id,
    });

    sendEmail({
      to: debtor.email,
      subject: `SettleUp - Reminder from ${req.user.name}`,
      html: `
        <h1>Payment reminder</h1>
        <p>Hello ${debtor.name},</p>
        <p>${req.user.name} is reminding you that you owe them <strong>${money}</strong> in the group <strong>${populatedGroup.name}</strong>.</p>
        <p><a href="${env.FRONTEND_URL}/groups/${populatedGroup._id}">Open the group</a> to settle up.</p>
      `,
    }).catch((err) => {
      console.error(err);
    });

    res.status(200).json({ message: `Reminder sent to ${debtor.name}` });
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
