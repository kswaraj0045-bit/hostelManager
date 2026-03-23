import mongoose from 'mongoose'

const reminderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  remind_at: { type: Date, required: true },
  repeat: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  isCompleted: { type: Boolean, default: false },
  isSnoozed: { type: Boolean, default: false },
  snoozedUntil: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('Reminder', reminderSchema)
