import express from 'express';
import {
  getChores,
  addChore,
  updateChore,
  deleteChore,
  approveChoreCompletion,
  rejectChoreCompletion
} from '../controllers/choreController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/:groupId', getChores);
router.post('/', addChore);
router.patch('/:id', updateChore);
router.patch('/:id/approve', approveChoreCompletion);
router.patch('/:id/reject', rejectChoreCompletion);
router.delete('/:id', deleteChore);

export default router;
