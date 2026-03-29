import Group from '../models/Group.js';
import { generateInviteCode } from '../utils/generateInviteCode.js';

const generateUniqueCode = async () => {
  let code;
  do {
    code = generateInviteCode();
  } while (await Group.findOne({ invite_code: code }));
  return code;
};

export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email avatar')
      .populate('created_by', 'name')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const invite_code = await generateUniqueCode();
    const group = await Group.create({
      name,
      type: type || 'hostel',
      created_by: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      invite_code
    });
    const populated = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('created_by', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('created_by', 'name');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this group' });
    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) return res.status(400).json({ success: false, message: 'Invite code required' });
    const group = await Group.findOne({ invite_code: invite_code.toUpperCase() });
    if (!group) return res.status(404).json({ success: false, message: 'Invalid invite code' });
    const alreadyMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'Already a member' });
    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();
    const populated = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('created_by', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isAdmin = group.created_by.toString() === req.user._id.toString();
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admin can remove members' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot remove themselves' });
    }

    group.members = group.members.filter((member) => member.user.toString() !== userId);
    await group.save();

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    const admin = group.members.find(m => m.role === 'admin');
    if (admin?.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can delete group' });
    }
    await Group.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
