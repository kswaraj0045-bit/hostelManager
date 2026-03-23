import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Chore from '../models/Chore.js';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import { calculateBalances } from './calculateBalances.js';

export async function buildAIContext(userId) {
  const groups = await Group.find({ 'members.user': userId }).populate('members.user', 'name email');
  const groupIds = groups.map(g => g._id);

  const expenses = await Expense.find({ group_id: { $in: groupIds } })
    .populate('paid_by', 'name')
    .populate('splits.user', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const settlements = await Settlement.find({ group_id: { $in: groupIds } })
    .populate('paid_by', 'name')
    .populate('paid_to', 'name')
    .lean();

  const balances = calculateBalances(expenses, settlements);
  const userIds = [...new Set(balances.flatMap(b => [b.user1, b.user2]))];
  const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u.name]));

  const chores = await Chore.find({ group_id: { $in: groupIds }, status: 'pending' })
    .populate('assigned_to', 'name')
    .populate('group_id', 'name')
    .lean();

  const bills = await Bill.find({ group_id: { $in: groupIds }, paid: false })
    .populate('group_id', 'name')
    .lean();

  const context = {
    groups: groups.map(g => ({ name: g.name, type: g.type, members: g.members.map(m => m.user?.name) })),
    recentExpenses: expenses.map(e => ({
      description: e.description,
      amount: e.amount,
      category: e.category,
      paidBy: e.paid_by?.name,
      date: e.date
    })),
    balances: balances.map(b => ({
      from: userMap[b.user1] || b.user1,
      to: userMap[b.user2] || b.user2,
      amount: b.amount
    })),
    pendingChores: chores.map(c => ({
      title: c.title,
      assignedTo: c.assigned_to?.name,
      dueDate: c.due_date,
      group: c.group_id?.name
    })),
    unpaidBills: bills.map(b => ({
      title: b.title,
      amount: b.amount,
      dueDate: b.due_date,
      group: b.group_id?.name
    }))
  };

  return JSON.stringify(context, null, 2);
}
