import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { getMessages, sendMessage, pinMessage, deleteMessage } from '../controllers/chatController.js'

const router = express.Router()

router.get('/:groupId', protect, getMessages)
router.post('/:groupId', protect, sendMessage)
router.patch('/:messageId/pin', protect, pinMessage)
router.delete('/:messageId', protect, deleteMessage)

export default router
