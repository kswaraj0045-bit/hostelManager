import mongoose from 'mongoose';

const choreSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  due_date: { type: Date },
  status: { type: String, enum: ['pending', 'done', 'skipped'], default: 'pending' },
  recurrence: { type: String, enum: ['daily', 'weekly', 'none'], default: 'weekly' },
  completionRequested: { type: Boolean, default: false },
  completionRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completionRequestedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Chore', choreSchema);
