import express from 'express';
import { getMess, createOrUpdateMess, voteMeal } from '../controllers/messController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/:groupId', getMess);
router.post('/', createOrUpdateMess);
router.patch('/:id/vote', voteMeal);

export default router;
