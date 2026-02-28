import express from 'express';
import * as ec from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);

router.get('/summary', ec.getSummary);
router.get('/trend', ec.getTrend);
router.get('/by-category', ec.getByCategory);
router.get('/export/csv', ec.exportCSV);
router.get('/export/pdf', ec.exportPDF);

router.get('/', ec.getExpenses);
router.post('/', ec.createExpense);
router.post('/upload-receipt', upload.single('receipt'), ec.uploadReceipt);
router.post('/bulk-delete', ec.bulkDeleteExpenses);
router.post('/restore/:id', ec.restoreExpense);
router.put('/:id', ec.updateExpense);
router.delete('/:id', ec.deleteExpense);

export default router;
