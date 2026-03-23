import mongoose from 'mongoose'

const shoppingItemSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  name: { type: String, required: true },
  quantity: { type: String, default: '1' },
  category: {
    type: String,
    enum: ['grocery', 'vegetable', 'fruit', 'dairy', 'snack', 'other'],
    default: 'other'
  },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isChecked: { type: Boolean, default: false },
  checkedAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('ShoppingItem', shoppingItemSchema)
