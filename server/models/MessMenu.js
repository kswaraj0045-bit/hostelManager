import mongoose from 'mongoose';

const daySchema = new mongoose.Schema({
  day: { type: String, required: true },
  meal: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const messMenuSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  week_start: { type: Date, required: true },
  days: [daySchema]
}, { timestamps: true });

export default mongoose.model('MessMenu', messMenuSchema);
