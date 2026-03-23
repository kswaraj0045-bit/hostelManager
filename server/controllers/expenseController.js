import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import { calculateBalances } from '../utils/calculateBalances.js';
import { emitToGroup } from '../utils/socketEmitter.js';

const getId = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

const ensureMember = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return false;
  return group.members.some((m) => m.user.toString() === userId.toString());
};

const buildUserMap = (expenses = [], settlements = []) => {
  const userMap = {};

  expenses.forEach((expense) => {
    const payerId = getId(expense?.paid_by);
    if (payerId && expense.paid_by) {
      userMap[payerId] = expense.paid_by;
    }

    (expense.splits || []).forEach((split) => {
      const userId = getId(split?.user);
      if (userId && split.user) {
        userMap[userId] = split.user;
      }
    });
  });

  settlements.forEach((settlement) => {
    const paidById = getId(settlement?.paid_by);
    const paidToId = getId(settlement?.paid_to);

    if (paidById && settlement.paid_by) {
      userMap[paidById] = settlement.paid_by;
    }

    if (paidToId && settlement.paid_to) {
      userMap[paidToId] = settlement.paid_to;
    }
  });

  return userMap;
};

const getUserPayload = (userMap, userId) => (
  userMap[userId] || { _id: userId, name: 'Unknown' }
);

export const getExpenses = async (req, res, next) => {
  try {
    const isMember = await ensureMember(req.params.groupId, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ group_id: req.params.groupId })
      .populate('paid_by', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .sort({ date: -1 });

    res.json({ success: true, data: expenses });
  } catch (err) {
    next(err);
  }
};

export const addExpense = async (req, res, next) => {
  try {
    const { group_id, description, amount, category, paid_by, splits, date } = req.body;

    if (!group_id || !description || !amount || !paid_by || !splits?.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const isMember = await ensureMember(group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expense = await Expense.create({
      group_id,
      description,
      amount,
      category: category || 'misc',
      paid_by,
      splits,
      date: date ? new Date(date) : new Date()
    });

    const populated = await Expense.findById(expense._id)
      .populate('paid_by', 'name email avatar')
      .populate('splits.user', 'name email avatar');

    emitToGroup(group_id.toString(), 'expense:added', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const isMember = await ensureMember(expense.group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

export const getBalance = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const isMember = await ensureMember(groupId, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ group_id: groupId })
      .populate('paid_by', '_id name email avatar')
      .populate('splits.user', '_id name email avatar');

    const settlements = await Settlement.find({ group_id: groupId })
      .populate('paid_by', '_id name email avatar')
      .populate('paid_to', '_id name email avatar');

    const balanceResults = calculateBalances(expenses, settlements);
    const userMap = buildUserMap(expenses, settlements);

    const populatedResults = balanceResults.map((result) => ({
      owes: result.owes,
      owed: result.owed,
      owesUser: getUserPayload(userMap, result.owes),
      owedUser: getUserPayload(userMap, result.owed),
      amount: result.amount
    }));

    res.json({ success: true, data: populatedResults });
  } catch (err) {
    next(err);
  }
};

export const getOverallBalance = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const groups = await Group.find({ 'members.user': req.user._id });

    let totalOwed = 0;
    let totalOwing = 0;
    const balancesByGroup = [];
    const dashboardBalanceMap = {};

    for (const group of groups) {
      const [expenses, settlements] = await Promise.all([
        Expense.find({ group_id: group._id })
          .populate('paid_by', '_id name email avatar')
          .populate('splits.user', '_id name email avatar'),
        Settlement.find({ group_id: group._id })
          .populate('paid_by', '_id name email avatar')
          .populate('paid_to', '_id name email avatar')
      ]);

      const balanceResults = calculateBalances(expenses, settlements);
      const userMap = buildUserMap(expenses, settlements);

      const groupBalances = balanceResults
        .filter((result) => result.owes === userId || result.owed === userId)
        .map((result) => ({
          owes: getUserPayload(userMap, result.owes),
          owed: getUserPayload(userMap, result.owed),
          owesId: result.owes,
          owedId: result.owed,
          amount: result.amount,
          groupId: group._id,
          groupName: group.name,
          groupType: group.type
        }));

      groupBalances.forEach((balance) => {
        const owedId = getId(balance.owed);
        const owesId = getId(balance.owes);
        const direction = owesId === userId ? 'you_owe' : 'owed_to_you';
        const otherUser = direction === 'you_owe' ? balance.owed : balance.owes;
        const otherUserId = getId(otherUser);
        const summaryKey = `${direction}:${otherUserId}`;

        if (owedId === userId) totalOwed += balance.amount;
        if (owesId === userId) totalOwing += balance.amount;

        if (!dashboardBalanceMap[summaryKey]) {
          dashboardBalanceMap[summaryKey] = {
            otherUserId,
            otherUserName: otherUser?.name || 'Unknown',
            otherUserAvatar: otherUser?.avatar || '',
            amount: 0,
            direction
          };
        }

        dashboardBalanceMap[summaryKey].amount += balance.amount;
      });

      if (groupBalances.length > 0) {
        balancesByGroup.push({
          groupId: group._id,
          groupName: group.name,
          groupType: group.type,
          balances: groupBalances
        });
      }
    }

    res.json({
      success: true,
      data: {
        netBalance: parseFloat((totalOwed - totalOwing).toFixed(2)),
        totalOwed: parseFloat(totalOwed.toFixed(2)),
        totalOwing: parseFloat(totalOwing.toFixed(2)),
        totalOwedToUser: parseFloat(totalOwed.toFixed(2)),
        totalUserOwes: parseFloat(totalOwing.toFixed(2)),
        userBalances: Object.values(dashboardBalanceMap)
          .map((balance) => ({
            ...balance,
            amount: parseFloat(balance.amount.toFixed(2))
          }))
          .sort((a, b) => b.amount - a.amount),
        balancesByGroup
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const [expenses, settlements] = await Promise.all([
      Expense.find({
        $or: [
          { paid_by: req.user._id },
          { 'splits.user': req.user._id }
        ]
      })
        .populate('paid_by', '_id name email avatar')
        .populate('splits.user', '_id name email avatar')
        .populate('group_id', 'name type'),
      Settlement.find({
        $or: [
          { paid_by: req.user._id },
          { paid_to: req.user._id }
        ]
      })
        .populate('paid_by', '_id name email avatar')
        .populate('paid_to', '_id name email avatar')
        .populate('group_id', 'name type')
    ]);

    const expenseHistory = expenses.map((expense) => ({
      ...expense.toObject(),
      type: 'expense',
      direction: getId(expense.paid_by) === userId ? 'paid' : 'received'
    }));

    const settlementHistory = settlements.map((settlement) => ({
      ...settlement.toObject(),
      type: 'settlement',
      direction: getId(settlement.paid_by) === userId ? 'paid' : 'received'
    }));

    const combined = [...expenseHistory, ...settlementHistory].sort((left, right) => {
      const leftDate = new Date(left.createdAt || left.date || 0).getTime();
      const rightDate = new Date(right.createdAt || right.date || 0).getTime();
      return rightDate - leftDate;
    });

    res.json({ success: true, data: combined });
  } catch (err) {
    next(err);
  }
};
