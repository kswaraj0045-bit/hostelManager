import express from 'express';
import { addSettlement, getSettlements } from '../controllers/settlementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', addSettlement);
router.get('/:groupId', getSettlements);

export default router;
