import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import { calculateBalances } from '../utils/calculateBalances.js';

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

export const createSettlement = async (req, res, next) => {
  try {
    const { group_id, paid_to, amount, note } = req.body;
    const paid_by = req.user._id;

    if (!group_id || !paid_to || !amount) {
      return res.status(400).json({ success: false, message: 'group_id, paid_to and amount are required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Settlement amount must be greater than 0' });
    }

    const group = await Group.findById(group_id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some((member) => member.user.toString() === paid_by.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    if (paid_to.toString() === paid_by.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot settle up with yourself' });
    }

    const isTargetMember = group.members.some((member) => member.user.toString() === paid_to.toString());
    if (!isTargetMember) {
      return res.status(400).json({ success: false, message: 'Selected user is not a member of this group' });
    }

    const expenses = await Expense.find({ group_id })
      .populate('paid_by', '_id name email avatar')
      .populate('splits.user', '_id name email avatar');

    const existingSettlements = await Settlement.find({ group_id })
      .populate('paid_by', '_id name email avatar')
      .populate('paid_to', '_id name email avatar');

    const balanceResults = calculateBalances(expenses, existingSettlements);

    const myBalance = balanceResults.find((result) => (
      result.owes === paid_by.toString() && result.owed === paid_to.toString()
    ));

    if (!myBalance) {
      return res.status(400).json({ success: false, message: 'You do not owe this person anything' });
    }

    if (parseFloat(amount) > myBalance.amount + 0.01) {
      return res.status(400).json({
        success: false,
        message: `You can settle maximum ₹${myBalance.amount}. You cannot pay more than what you owe.`
      });
    }

    const settlement = await Settlement.create({
      group_id,
      paid_by,
      paid_to,
      amount: parseFloat(amount),
      note: note || ''
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('paid_by', '_id name email avatar')
      .populate('paid_to', '_id name email avatar');

    const [updatedExpenses, updatedSettlements] = await Promise.all([
      Expense.find({ group_id })
        .populate('paid_by', '_id name email avatar')
        .populate('splits.user', '_id name email avatar'),
      Settlement.find({ group_id })
        .populate('paid_by', '_id name email avatar')
        .populate('paid_to', '_id name email avatar')
    ]);

    const updatedBalances = calculateBalances(updatedExpenses, updatedSettlements);
    const userMap = buildUserMap(updatedExpenses, updatedSettlements);

    const populatedBalances = updatedBalances.map((result) => ({
      owes: result.owes,
      owed: result.owed,
      owesUser: getUserPayload(userMap, result.owes),
      owedUser: getUserPayload(userMap, result.owed),
      amount: result.amount
    }));

    const io = req.app.get('io');
    if (io) {
      io.to(group_id.toString()).emit('settlement:added', {
        settlement: populatedSettlement,
        updatedBalances: populatedBalances
      });
    }

    res.status(201).json({
      success: true,
      data: {
        settlement: populatedSettlement,
        updatedBalances: populatedBalances
      }
    });
  } catch (err) {
    next(err);
  }
};

export const addSettlement = createSettlement;

export const getSettlements = async (req, res, next) => {
  try {
    const isMember = await ensureMember(req.params.groupId, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const settlements = await Settlement.find({ group_id: req.params.groupId })
      .populate('paid_by', 'name email avatar')
      .populate('paid_to', 'name email avatar')
      .sort({ date: -1 });

    res.json({ success: true, data: settlements });
  } catch (err) {
    next(err);
  }
};
