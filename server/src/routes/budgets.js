import express from 'express';
import * as bc from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', bc.getBudgets);
router.post('/', bc.createBudget);
router.put('/:id', bc.updateBudget);
router.delete('/:id', bc.deleteBudget);

export default router;
