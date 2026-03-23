import Reminder from '../models/Reminder.js'

export const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ user_id: req.user._id })
      .sort({ remind_at: 1 })
    res.json({ success: true, data: reminders })
  } catch (err) {
    next(err)
  }
}

export const createReminder = async (req, res, next) => {
  try {
    const { title, description, remind_at, repeat, group_id, channels } = req.body
    if (!title || !remind_at) {
      return res.status(400).json({ success: false, message: 'Title and remind_at are required' })
    }
    const reminder = await Reminder.create({
      user_id: req.user._id,
      group_id: group_id || null,
      title,
      description: description || '',
      remind_at: new Date(remind_at),
      repeat: repeat || 'none',
      channels: channels || { inApp: true, email: true, push: true }
    })
    res.status(201).json({ success: true, data: reminder })
  } catch (err) {
    next(err)
  }
}

export const updateReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' })
    if (reminder.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    const updated = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

export const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' })
    if (reminder.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    await Reminder.findByIdAndDelete(req.params.id)
    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
}

export const snoozeReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' })
    if (reminder.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    const snoozedUntil = new Date(Date.now() + 30 * 60 * 1000)
    const updated = await Reminder.findByIdAndUpdate(
      req.params.id,
      { isSnoozed: true, snoozedUntil },
      { new: true }
    )
    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

export const completeReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' })
    if (reminder.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    const updated = await Reminder.findByIdAndUpdate(
      req.params.id,
      { isCompleted: true },
      { new: true }
    )
    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}
