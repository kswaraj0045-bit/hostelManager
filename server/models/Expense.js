import mongoose from 'mongoose';

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false }
});

const expenseSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['food', 'travel', 'utilities', 'shopping', 'misc'], default: 'misc' },
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splits: [splitSchema],
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
