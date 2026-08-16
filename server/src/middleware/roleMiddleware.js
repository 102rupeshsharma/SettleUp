import Group from '../models/Group.js';
import Expense from '../models/Expense.js';

export const isGroupMember = async (req, res, next) => {
  try {
    let groupId = req.params.id || req.body.groupId || req.query.groupId;

    if (!groupId && req.params.id) {
      const expense = await Expense.findById(req.params.id);
      if (expense) {
        groupId = expense.groupId;
      }
    }

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: 'Access denied: not a group member' });
    }

    req.group = group;
    req.memberRole = member.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const isGroupAdmin = async (req, res, next) => {
  try {
    let groupId = req.params.id || req.body.groupId || req.query.groupId;

    if (!groupId && req.params.id) {
      const expense = await Expense.findById(req.params.id);
      if (expense) {
        groupId = expense.groupId;
      }
    }

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: 'Access denied: not a group member' });
    }

    if (member.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin permission required' });
    }

    req.group = group;
    req.memberRole = member.role;
    next();
  } catch (error) {
    next(error);
  }
};
