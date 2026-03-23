import Bill from '../models/Bill.js';
import Group from '../models/Group.js';
import { emitToGroup } from '../utils/socketEmitter.js';

const getGroup = async (groupId) => Group.findById(groupId);

const isMember = (group, userId) => {
  if (!group) return false;
  return group.members.some((member) => member.user.toString() === userId.toString());
};

export const getBills = async (req, res, next) => {
  try {
    const group = await getGroup(req.params.groupId);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });
    const bills = await Bill.find({ group_id: req.params.groupId })
      .populate('group_id', 'name')
      .populate('assigned_to', 'name email avatar')
      .populate('paid_by', 'name email avatar')
      .populate('split_among', 'name email avatar')
      .sort({ due_date: 1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    next(err);
  }
};

export const addBill = async (req, res, next) => {
  try {
    const { group_id, title, amount, due_date, split_among, assigned_to } = req.body;
    if (!group_id || !title || !amount) return res.status(400).json({ success: false, message: 'Group, title and amount required' });
    const group = await getGroup(group_id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    const memberIds = new Set(group.members.map((member) => member.user.toString()));
    const responsibleUserId = (assigned_to || req.user._id).toString();
    const participants = Array.isArray(split_among) && split_among.length
      ? split_among.map((memberId) => memberId.toString())
      : group.members.map((member) => member.user.toString());

    if (!memberIds.has(responsibleUserId)) {
      return res.status(400).json({ success: false, message: 'Assigned payer must be a group member' });
    }

    if (participants.some((memberId) => !memberIds.has(memberId))) {
      return res.status(400).json({ success: false, message: 'All split members must belong to the group' });
    }

    const bill = await Bill.create({
      group_id,
      title,
      amount,
      due_date: due_date ? new Date(due_date) : null,
      assigned_to: responsibleUserId,
      split_among: participants
    });
    const populated = await Bill.findById(bill._id)
      .populate('group_id', 'name')
      .populate('assigned_to', 'name email avatar')
      .populate('paid_by', 'name email avatar')
      .populate('split_among', 'name email avatar');
    emitToGroup(group_id.toString(), 'bill:added', populated);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    const group = await getGroup(bill.group_id);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    const memberIds = new Set(group.members.map((member) => member.user.toString()));

    if (req.body.assigned_to !== undefined) {
      const assignedUserId = req.body.assigned_to ? req.body.assigned_to.toString() : '';
      if (assignedUserId && !memberIds.has(assignedUserId)) {
        return res.status(400).json({ success: false, message: 'Assigned payer must be a group member' });
      }
      bill.assigned_to = assignedUserId || undefined;
    }

    if (req.body.paid !== undefined) {
      bill.paid = req.body.paid;
      if (req.body.paid) {
        const assignedUserId = bill.assigned_to?.toString?.() || bill.assigned_to?.toString() || '';
        if (assignedUserId && assignedUserId !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Only the assigned user can mark this bill as paid' });
        }

        const payerId = assignedUserId || req.user._id.toString();
        bill.assigned_to = payerId;
        bill.paid_by = payerId;
      } else {
        bill.paid_by = undefined;
      }
    } else if (req.body.paid_by !== undefined) {
      const payerId = req.body.paid_by ? req.body.paid_by.toString() : '';
      if (payerId && !memberIds.has(payerId)) {
        return res.status(400).json({ success: false, message: 'Paid by user must be a group member' });
      }
      if (bill.assigned_to && payerId && bill.assigned_to.toString() !== payerId) {
        return res.status(400).json({ success: false, message: 'Bill can only be paid by the assigned user' });
      }
      bill.assigned_to = payerId || bill.assigned_to;
      bill.paid_by = payerId || undefined;
    }

    await bill.save();
    const populated = await Bill.findById(bill._id)
      .populate('group_id', 'name')
      .populate('assigned_to', 'name email avatar')
      .populate('paid_by', 'name email avatar')
      .populate('split_among', 'name email avatar');
    emitToGroup(bill.group_id.toString(), 'bill:updated', populated);
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    const group = await getGroup(bill.group_id);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
