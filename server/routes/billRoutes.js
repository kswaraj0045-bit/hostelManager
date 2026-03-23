import express from 'express';
import { getBills, addBill, updateBill, deleteBill } from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/:groupId', getBills);
router.post('/', addBill);
router.patch('/:id', updateBill);
router.delete('/:id', deleteBill);

export default router;
