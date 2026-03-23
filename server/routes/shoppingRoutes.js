import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { getShoppingList, addItem, checkItem, deleteItem, getAISuggestions } from '../controllers/shoppingController.js'

const router = express.Router()

router.get('/:groupId', protect, getShoppingList)
router.post('/:groupId', protect, addItem)
router.patch('/:itemId/check', protect, checkItem)
router.delete('/:itemId', protect, deleteItem)
router.post('/:groupId/ai-suggest', protect, getAISuggestions)

export default router
