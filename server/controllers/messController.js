import MessMenu from '../models/MessMenu.js';
import Group from '../models/Group.js';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const toDateValue = (value) => {
  if (value instanceof Date) return new Date(value);

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }

  return new Date(value);
};

const ensureMember = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return false;
  return group.members.some(m => m.user.toString() === userId.toString());
};

const getWeekStart = (date) => {
  const d = toDateValue(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const populateMenu = (query) => query.populate('days.votes', 'name');

const normalizeDays = (days = [], existingDays = []) => {
  const existingByDay = new Map(
    existingDays.map((item) => [item.day, item])
  );
  const normalizedByDay = new Map();

  days.forEach((item) => {
    const day = item?.day;
    const meal = item?.meal?.trim?.() || '';

    if (!WEEK_DAYS.includes(day) || !meal) return;

    const existing = existingByDay.get(day);
    normalizedByDay.set(day, {
      day,
      meal,
      votes: existing && existing.meal === meal ? existing.votes : []
    });
  });

  return WEEK_DAYS
    .map((day) => normalizedByDay.get(day))
    .filter(Boolean);
};

export const getMess = async (req, res, next) => {
  try {
    const isMember = await ensureMember(req.params.groupId, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const weekStart = getWeekStart(new Date());
    let menu = await populateMenu(MessMenu.findOne({ group_id: req.params.groupId, week_start: weekStart }));
    if (!menu) {
      menu = await MessMenu.create({
        group_id: req.params.groupId,
        week_start: weekStart,
        days: []
      });
      menu = await populateMenu(MessMenu.findById(menu._id));
    }
    res.json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

export const createOrUpdateMess = async (req, res, next) => {
  try {
    const { group_id, week_start, days } = req.body;
    if (!group_id || !Array.isArray(days)) {
      return res.status(400).json({ success: false, message: 'Group and days required' });
    }
    const isMember = await ensureMember(group_id, req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    const ws = week_start ? getWeekStart(new Date(week_start)) : getWeekStart(new Date());
    let menu = await MessMenu.findOne({ group_id, week_start: ws });
    const normalizedDays = normalizeDays(days, menu?.days || []);
    if (!menu) {
      menu = await MessMenu.create({ group_id, week_start: ws, days: normalizedDays });
    } else {
      menu.days = normalizedDays;
      await menu.save();
    }
    menu = await populateMenu(MessMenu.findById(menu._id));
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
    const updated = await populateMenu(MessMenu.findById(menu._id));
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
