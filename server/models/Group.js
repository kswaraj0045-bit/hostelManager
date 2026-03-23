import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joined_at: { type: Date, default: Date.now }
});

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['hostel', 'trip', 'friends', 'family', 'other'], default: 'hostel' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  invite_code: { type: String, unique: true, required: true }
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
