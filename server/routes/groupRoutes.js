import express from 'express';
import { getGroups, createGroup, getGroup, joinGroup, deleteGroup } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:id', getGroup);
router.post('/join', joinGroup);
router.delete('/:id', deleteGroup);

export default router;
