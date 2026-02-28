import express from 'express';
import * as cc from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', cc.getCategories);
router.post('/', cc.createCategory);
router.put('/:id', cc.updateCategory);
router.delete('/:id', cc.deleteCategory);

export default router;
