import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';

/*
 * Net position of every current member of a group, keyed by user id.
 *
 * Sign convention:
 * 1. Expenses:
 *    - paidBy: net += amount (they paid the bill, meaning they are owed this total back)
 *    - split.userId: net -= amount (they shared the cost, meaning they owe this share)
 * 2. Settlements:
 *    - fromUser: net += amount (they paid cash to resolve debt; increases net back up to zero)
 *    - toUser: net -= amount (they received cash; reduces their overall credit back down to zero)
 *
 * Works whether or not group.members.userId is populated.
 */
export const calculateNets = async (group) => {
  const expenses = await Expense.find({ groupId: group._id });
  const settlements = await Settlement.find({ groupId: group._id });

  const nets = {};
  group.members.forEach((m) => {
    const uId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
    nets[uId] = 0;
  });

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
