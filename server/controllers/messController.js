import MessMenu from '../models/MessMenu.js';
import Group from '../models/Group.js';

const ensureMember = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return false;
  return group.members.some(m => m.user.toString() === userId.toString());
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export const getMess = async (req, res, next) => {
  try {
    const isMember = await ensureMember(req.params.groupId, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const weekStart = getWeekStart(new Date());
    let menu = await MessMenu.findOne({ group_id: req.params.groupId, week_start: weekStart })
      .populate('days.votes', 'name');
    if (!menu) {
      menu = await MessMenu.create({
        group_id: req.params.groupId,
        week_start: weekStart,
        days: []
      });
    }
    res.json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

export const createOrUpdateMess = async (req, res, next) => {
  try {
    const { group_id, week_start, days } = req.body;
    if (!group_id || !days?.length) return res.status(400).json({ success: false, message: 'Group and days required' });
    const isMember = await ensureMember(group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const ws = week_start ? getWeekStart(new Date(week_start)) : getWeekStart(new Date());
    let menu = await MessMenu.findOne({ group_id, week_start: ws });
    if (!menu) {
      menu = await MessMenu.create({ group_id, week_start: ws, days });
    } else {
      menu.days = days;
      await menu.save();
    }
    res.json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

export const voteMeal = async (req, res, next) => {
  try {
    const menu = await MessMenu.findById(req.params.id);
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    const isMember = await ensureMember(menu.group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const { dayIndex } = req.body;
    if (dayIndex === undefined || dayIndex < 0 || dayIndex >= menu.days.length) {
      return res.status(400).json({ success: false, message: 'Invalid day index' });
    }
    const day = menu.days[dayIndex];
    const idx = day.votes.findIndex(v => v.toString() === req.user._id.toString());
    if (idx >= 0) day.votes.splice(idx, 1);
    else day.votes.push(req.user._id);
    await menu.save();
    const updated = await MessMenu.findById(menu._id).populate('days.votes', 'name');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
