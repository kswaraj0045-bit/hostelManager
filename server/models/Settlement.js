import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paid_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Settlement', settlementSchema);
