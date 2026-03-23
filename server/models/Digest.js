import mongoose from 'mongoose';

const digestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  week_start: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Digest', digestSchema);
