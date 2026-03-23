import express from 'express';
import {
  getExpenses,
  addExpense,
  deleteExpense,
  getBalance,
  getOverallBalance
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/overall-balance', getOverallBalance);
router.get('/balance/:groupId', getBalance);
router.get('/:groupId', getExpenses);
router.post('/', addExpense);
router.delete('/:id', deleteExpense);

export default router;
