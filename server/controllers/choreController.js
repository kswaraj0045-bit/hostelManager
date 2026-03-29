import Chore from '../models/Chore.js';
import Group from '../models/Group.js';
import { emitToGroup } from '../utils/socketEmitter.js';

const getGroup = async (groupId) => Group.findById(groupId);

const isMember = (group, userId) => {
  if (!group) return false;
  return group.members.some((member) => member.user.toString() === userId.toString());
};

const isGroupAdmin = (group, userId) => {
  if (!group?.created_by) return false;
  return group.created_by.toString() === userId.toString();
};

const populateChore = (query) => query
  .populate('assigned_to', 'name email avatar')
  .populate('completionRequestedBy', 'name email avatar');

export const getChores = async (req, res, next) => {
  try {
    const group = await getGroup(req.params.groupId);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });
    const chores = await populateChore(
      Chore.find({ group_id: req.params.groupId })
    )
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
    const group = await getGroup(group_id);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });
    const chore = await Chore.create({
      group_id,
      title,
      assigned_to: assigned_to || null,
      due_date: due_date ? new Date(due_date) : null,
      recurrence: recurrence || 'weekly'
    });
    const populated = await populateChore(Chore.findById(chore._id));
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
    const group = await getGroup(chore.group_id);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    const admin = isGroupAdmin(group, req.user._id);

    if (req.body.status !== undefined) {
      if (req.body.status === 'done') {
        if (admin) {
          chore.status = 'done';
          chore.completionRequested = false;
          chore.completionRequestedBy = null;
          chore.completionRequestedAt = null;
        } else {
          chore.status = 'pending';
          chore.completionRequested = true;
          chore.completionRequestedBy = req.user._id;
          chore.completionRequestedAt = new Date();
        }
      } else {
        chore.status = req.body.status;
        chore.completionRequested = false;
        chore.completionRequestedBy = null;
        chore.completionRequestedAt = null;
      }
    }

    if (req.body.assigned_to !== undefined) chore.assigned_to = req.body.assigned_to || null;
    if (req.body.due_date !== undefined) chore.due_date = req.body.due_date ? new Date(req.body.due_date) : null;
    if (req.body.title) chore.title = req.body.title;
    await chore.save();
    const populated = await populateChore(Chore.findById(chore._id));
    emitToGroup(chore.group_id.toString(), 'chore:updated', populated);
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const approveChoreCompletion = async (req, res, next) => {
  try {
    const chore = await Chore.findById(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: 'Chore not found' });

    const group = await getGroup(chore.group_id);
    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only admin can approve completion' });
    }

    chore.status = 'done';
    chore.completionRequested = false;
    chore.completionRequestedBy = null;
    chore.completionRequestedAt = null;
    await chore.save();

    const populated = await populateChore(Chore.findById(chore._id));
    emitToGroup(chore.group_id.toString(), 'chore:updated', populated);
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const rejectChoreCompletion = async (req, res, next) => {
  try {
    const chore = await Chore.findById(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: 'Chore not found' });

    const group = await getGroup(chore.group_id);
    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only admin can reject completion' });
    }

    chore.status = 'pending';
    chore.completionRequested = false;
    chore.completionRequestedBy = null;
    chore.completionRequestedAt = null;
    await chore.save();

    const populated = await populateChore(Chore.findById(chore._id));
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
    const group = await getGroup(chore.group_id);
    if (!isMember(group, req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });
    await Chore.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
