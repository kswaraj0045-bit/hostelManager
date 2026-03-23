import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['user', 'assistant', 'digest'], default: 'user' },
  content: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
