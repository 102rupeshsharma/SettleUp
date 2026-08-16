import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { id } = req.params;
    const breakdown = await Expense.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: { $round: ['$total', 2] },
        },
      },
    ]);

    res.status(200).json(breakdown);
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trend = await Expense.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: { $round: ['$total', 2] },
        },
      },
      { $sort: { month: 1 } },
    ]);

    res.status(200).json(trend);
  } catch (error) {
    next(error);
  }
};

export const getUserOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userGroups = await Group.find({ 'members.userId': userId });
    const groupIds = userGroups.map((g) => g._id);

    const expenseAgg = await Expense.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      {
        $project: {
          groupId: 1,
          paidVal: {
            $cond: { if: { $eq: ['$paidBy', userId] }, then: '$amount', else: 0 },
          },
          shareVal: {
            $reduce: {
              input: '$splits',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $cond: { if: { $eq: ['$$this.userId', userId] }, then: '$$this.amount', else: 0 },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$groupId',
          netExpense: { $sum: { $subtract: ['$paidVal', '$shareVal'] } },
        },
      },
    ]);

    const settlementAgg = await Settlement.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      {
        $project: {
          groupId: 1,
          sentVal: {
            $cond: { if: { $eq: ['$fromUser', userId] }, then: '$amount', else: 0 },
          },
          receivedVal: {
            $cond: { if: { $eq: ['$toUser', userId] }, then: '$amount', else: 0 },
          },
        },
      },
      {
        $group: {
          _id: '$groupId',
          netSettlement: { $sum: { $subtract: ['$sentVal', '$receivedVal'] } },
        },
      },
    ]);

    const groupBalances = {};
    groupIds.forEach((gId) => {
      groupBalances[gId.toString()] = 0;
    });

    expenseAgg.forEach((item) => {
      if (item._id) {
        groupBalances[item._id.toString()] += item.netExpense;
      }
    });

    settlementAgg.forEach((item) => {
      if (item._id) {
        groupBalances[item._id.toString()] += item.netSettlement;
      }
    });

    let totalOwed = 0;
    let totalOwing = 0;

    Object.values(groupBalances).forEach((net) => {
      if (net > 0.01) {
        totalOwed += net;
      } else if (net < -0.01) {
        totalOwing += Math.abs(net);
      }
    });

    res.status(200).json({
      totalOwed: parseFloat(totalOwed.toFixed(2)),
      totalOwing: parseFloat(totalOwing.toFixed(2)),
      groupCount: groupIds.length,
    });
  } catch (error) {
    next(error);
  }
};
