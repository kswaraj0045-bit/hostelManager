import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  snoozeReminder,
  completeReminder
} from '../controllers/reminderController.js'

const router = express.Router()

router.get('/', protect, getReminders)
router.post('/', protect, createReminder)
router.patch('/:id', protect, updateReminder)
router.delete('/:id', protect, deleteReminder)
router.patch('/:id/snooze', protect, snoozeReminder)
router.patch('/:id/complete', protect, completeReminder)

export default router
