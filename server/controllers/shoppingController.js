import ShoppingItem from '../models/ShoppingList.js'
import Group from '../models/Group.js'
import MessMenu from '../models/MessMenu.js'
import fetch from 'node-fetch'

const ensureMember = async (groupId, userId) => {
  const group = await Group.findById(groupId)
  if (!group) return false
  return group.members.some(m => m.user.toString() === userId.toString())
}

export const getShoppingList = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const isMember = await ensureMember(groupId, req.user._id)
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })
    const items = await ShoppingItem.find({ group_id: groupId })
      .populate('addedBy', 'name avatar')
      .populate('checkedBy', 'name avatar')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: items })
  } catch (err) {
    next(err)
  }
}

export const addItem = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const { name, quantity, category } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Item name is required' })
    const isMember = await ensureMember(groupId, req.user._id)
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })
    const item = await ShoppingItem.create({
      group_id: groupId,
      name,
      quantity: quantity || '1',
      category: category || 'other',
      addedBy: req.user._id
    })
    const populated = await ShoppingItem.findById(item._id)
      .populate('addedBy', 'name avatar')
      .populate('checkedBy', 'name avatar')
    res.status(201).json({ success: true, data: populated })
  } catch (err) {
    next(err)
  }
}

export const checkItem = async (req, res, next) => {
  try {
    const item = await ShoppingItem.findById(req.params.itemId)
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
    const isMember = await ensureMember(item.group_id, req.user._id)
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })
    const updated = await ShoppingItem.findByIdAndUpdate(
      req.params.itemId,
      {
        isChecked: !item.isChecked,
        checkedBy: !item.isChecked ? req.user._id : null,
        checkedAt: !item.isChecked ? new Date() : null
      },
      { new: true }
    ).populate('addedBy', 'name avatar').populate('checkedBy', 'name avatar')
    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

export const deleteItem = async (req, res, next) => {
  try {
    const item = await ShoppingItem.findById(req.params.itemId)
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
    const group = await Group.findById(item.group_id)
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
    const member = group.members.find(m => m.user.toString() === req.user._id.toString())
    const isAdder = item.addedBy.toString() === req.user._id.toString()
    const isAdmin = member?.role === 'admin'
    if (!isAdder && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    await ShoppingItem.findByIdAndDelete(req.params.itemId)
    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
}

export const getAISuggestions = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const isMember = await ensureMember(groupId, req.user._id)
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })

    const latestMenu = await MessMenu.findOne({ group_id: groupId }).sort({ createdAt: -1 })
    const existingItems = await ShoppingItem.find({ group_id: groupId, isChecked: false })
    const menuItems = latestMenu?.days?.map(d => d.meal).join(', ') || 'No mess menu available'
    const existingNames = existingItems.map(i => i.name).join(', ')

    const prompt = `Based on this weekly mess menu: ${menuItems}, suggest 5-10 grocery items that are likely needed. Existing items already on list: ${existingNames || 'none'}. Return ONLY a JSON array of objects with fields: name, quantity, category (one of: grocery, vegetable, fruit, dairy, snack, other). Example: [{"name":"Tomatoes","quantity":"1kg","category":"vegetable"}]. No explanation, just the JSON array.`

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )
    const data = await response.json()
    let suggestions = []
    try {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0])
    } catch (e) {
      suggestions = []
    }
    res.json({ success: true, data: suggestions })
  } catch (err) {
    next(err)
  }
}
