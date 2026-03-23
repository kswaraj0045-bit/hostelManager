import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { getOverview, getGroupAnalytics } from '../controllers/analyticsController.js'

const router = express.Router()

router.get('/overview', protect, getOverview)
router.get('/group/:id', protect, getGroupAnalytics)

export default router
