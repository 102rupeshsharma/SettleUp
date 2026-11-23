import crypto from 'crypto';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { calculateNets } from '../services/balances.js';
import { logActivity } from '../services/activityLog.js';
import { formatMoney } from '../utils/formatMoney.js';

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'];

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, currency } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const requested = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
    const groupCurrency = SUPPORTED_CURRENCIES.includes(requested)
      ? requested
      : req.user.defaultCurrency || 'INR';

    const group = await Group.create({
      name,
      description,
      currency: groupCurrency,
      createdBy: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'admin',
        },
      ],
    });

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

export const listGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ 'members.userId': req.user._id })
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email');
    res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
};

export const getGroupDetail = async (req, res, next) => {
  try {
    const group = await req.group.populate('members.userId', 'name email avatar');
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (name !== undefined) req.group.name = name;
    if (description !== undefined) req.group.description = description;

    const updatedGroup = await req.group.save();
    res.status(200).json(updatedGroup);
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const groupId = req.group._id;
    await Group.findByIdAndDelete(groupId);

    // Remove everything that only made sense inside this group.
    await Promise.all([
      Expense.deleteMany({ groupId }),
      Settlement.deleteMany({ groupId }),
      Notification.deleteMany({ groupId }),
      Activity.deleteMany({ groupId }),
    ]);

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const regenerateInviteCode = async (req, res, next) => {
  try {
    let unique = false;
    let newCode = '';
    while (!unique) {
      newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await Group.findOne({ inviteCode: newCode });
      if (!existing) {
        unique = true;
      }
    }

    req.group.inviteCode = newCode;
    const updatedGroup = await req.group.save();
    res.status(200).json({ inviteCode: updatedGroup.inviteCode });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Group not found with this invite code' });
    }

    const isAlreadyMember = group.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    group.members.push({
      userId: req.user._id,
      role: 'member',
    });

    await group.save();
    await logActivity(group._id, req.user._id, 'member_joined', 'joined the group');
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

export const changeMemberRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const member = req.group.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!member) {
      return res.status(404).json({ message: 'Member not found in group' });
    }

    if (userId === req.user._id.toString() && role !== 'admin') {
      const adminCount = req.group.members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot demote yourself: you are the sole admin of this group',
        });
      }
    }

    const roleChanged = member.role !== role;
    member.role = role;
    await req.group.save();

    if (roleChanged) {
      const target = await User.findById(userId).select('name');
      await logActivity(
        req.group._id,
        req.user._id,
        'role_changed',
        `changed ${target?.name || 'a member'}'s role to ${role}`
      );
    }

    const updatedGroup = await Group.findById(req.group._id).populate('members.userId', 'name email avatar');
    res.status(200).json(updatedGroup);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user._id.toString() && req.memberRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin permission required to eject other members' });
    }

    const memberIndex = req.group.members.findIndex(
      (m) => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in group' });
    }

    const memberToRemove = req.group.members[memberIndex];
    if (memberToRemove.role === 'admin') {
      const adminCount = req.group.members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot remove this member: they are the sole admin of this group. Assign another admin first.',
        });
      }
    }

    // Someone who still owes or is owed money can't go: their balance would
    // silently drop out of the group's totals.
    const isSelf = userId === req.user._id.toString();
    const nets = await calculateNets(req.group);
    const net = nets[userId] || 0;
    if (Math.abs(net) > 0.01) {
      const money = formatMoney(Math.abs(net), req.group.currency);
      const position = net < 0 ? `owe${isSelf ? '' : 's'} ${money}` : `${isSelf ? 'are' : 'is'} owed ${money}`;
      return res.status(400).json({
        message: isSelf
          ? `You still ${position} in this group. Settle up before leaving.`
          : `This member still ${position} in this group. Settle up before removing them.`,
      });
    }

    req.group.members.splice(memberIndex, 1);
    await req.group.save();

    if (isSelf) {
      await logActivity(req.group._id, req.user._id, 'member_left', 'left the group');
    } else {
      const removed = await User.findById(userId).select('name');
      await logActivity(
        req.group._id,
        req.user._id,
        'member_removed',
        `removed ${removed?.name || 'a member'} from the group`
      );
    }

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const listActivity = async (req, res, next) => {
  try {
    const activity = await Activity.find({ groupId: req.group._id })
      .populate('actor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(activity);
  } catch (error) {
    next(error);
  }
};
