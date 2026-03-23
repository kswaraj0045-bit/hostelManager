import Chore from '../models/Chore.js';
import Group from '../models/Group.js';
import { emitToGroup } from '../utils/socketEmitter.js';

const ensureMember = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return false;
  return group.members.some(m => m.user.toString() === userId.toString());
};

export const getChores = async (req, res, next) => {
  try {
    const isMember = await ensureMember(req.params.groupId, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const chores = await Chore.find({ group_id: req.params.groupId })
      .populate('assigned_to', 'name email avatar')
      .sort({ due_date: 1 });
    res.json({ success: true, data: chores });
  } catch (err) {
    next(err);
  }
};

export const addChore = async (req, res, next) => {
  try {
    const { group_id, title, assigned_to, due_date, recurrence } = req.body;
    if (!group_id || !title) return res.status(400).json({ success: false, message: 'Group and title required' });
    const isMember = await ensureMember(group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const chore = await Chore.create({
      group_id,
      title,
      assigned_to: assigned_to || null,
      due_date: due_date ? new Date(due_date) : null,
      recurrence: recurrence || 'weekly'
    });
    const populated = await Chore.findById(chore._id).populate('assigned_to', 'name email avatar');
    emitToGroup(group_id.toString(), 'chore:added', populated);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const updateChore = async (req, res, next) => {
  try {
    const chore = await Chore.findById(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: 'Chore not found' });
    const isMember = await ensureMember(chore.group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    if (req.body.status) chore.status = req.body.status;
    if (req.body.assigned_to !== undefined) chore.assigned_to = req.body.assigned_to;
    if (req.body.due_date !== undefined) chore.due_date = req.body.due_date;
    if (req.body.title) chore.title = req.body.title;
    await chore.save();
    const populated = await Chore.findById(chore._id).populate('assigned_to', 'name email avatar');
    emitToGroup(chore.group_id.toString(), 'chore:updated', populated);
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteChore = async (req, res, next) => {
  try {
    const chore = await Chore.findById(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: 'Chore not found' });
    const isMember = await ensureMember(chore.group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    await Chore.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
