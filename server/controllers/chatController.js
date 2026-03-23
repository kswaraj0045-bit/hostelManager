import ChatMessage from '../models/ChatMessage.js'
import Group from '../models/Group.js'
import { emitToGroup } from '../utils/socketEmitter.js'

export const getMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const group = await Group.findById(groupId)
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString())
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })

    const messages = await ChatMessage.find({ group_id: groupId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name avatar')
      .populate('replyTo')
    res.json({ success: true, data: messages.reverse() })
  } catch (err) {
    next(err)
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const { content, type, mentions, replyTo } = req.body
    if (!content && type !== 'system') {
      return res.status(400).json({ success: false, message: 'Content is required' })
    }
    const group = await Group.findById(groupId)
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString())
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' })

    const message = await ChatMessage.create({
      group_id: groupId,
      sender: req.user._id,
      content: content || '',
      type: type || 'text',
      mentions: mentions || [],
      replyTo: replyTo || null
    })
    const populated = await ChatMessage.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('replyTo')

    emitToGroup(groupId.toString(), 'chat:message', populated)
    res.status(201).json({ success: true, data: populated })
  } catch (err) {
    next(err)
  }
}

export const pinMessage = async (req, res, next) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId)
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    const group = await Group.findById(message.group_id)
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
    const member = group.members.find(m => m.user.toString() === req.user._id.toString())
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can pin messages' })
    }
    const updated = await ChatMessage.findByIdAndUpdate(
      req.params.messageId,
      { isPinned: !message.isPinned },
      { new: true }
    ).populate('sender', 'name avatar')
    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId)
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only sender can delete' })
    }
    await ChatMessage.findByIdAndDelete(req.params.messageId)
    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
}
