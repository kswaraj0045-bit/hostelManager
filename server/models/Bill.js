import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  due_date: { type: Date },
  paid: { type: Boolean, default: false },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  split_among: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  paymentRequested: { type: Boolean, default: false },
  paymentRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  paymentRequestedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Bill', billSchema);
