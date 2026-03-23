import express from 'express';
import { chat, getDigest, getChatHistory } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/chat', getChatHistory);
router.post('/chat', chat);
router.get('/digest', getDigest);

export default router;
