import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import dayjs from 'dayjs';

// GET /api/budgets
export const getBudgets = async (req, res, next) => {
    try {
        const month = req.query.month || dayjs().format('YYYY-MM');
        const start = dayjs(month).startOf('month').toDate();
        const end = dayjs(month).endOf('month').toDate();

        const budgets = await Budget.find({ owner: req.user._id, month }).populate('category', 'name icon color slug');

        // Compute actual spent per category for this month
        const spentAgg = await Expense.aggregate([
            { $match: { owner: req.user._id, isDeleted: false, date: { $gte: start, $lte: end } } },
            { $group: { _id: '$category', spent: { $sum: '$amount' } } },
        ]);
        const spentMap = Object.fromEntries(spentAgg.map((s) => [String(s._id), s.spent]));

        const result = budgets.map((b) => ({
            ...b.toObject(),
            spent: spentMap[String(b.category._id)] || 0,
            percentage: b.limit > 0 ? Math.round(((spentMap[String(b.category._id)] || 0) / b.limit) * 100) : 0,
            isOverspent: (spentMap[String(b.category._id)] || 0) > b.limit,
            isNearLimit: b.limit > 0 && (spentMap[String(b.category._id)] || 0) / b.limit * 100 >= b.alertThreshold,
        }));

        res.json({ budgets: result, month });
    } catch (err) { next(err); }
};

// POST /api/budgets
export const createBudget = async (req, res, next) => {
    try {
        const { category, month, limit, alertThreshold } = req.body;
        const budget = await Budget.findOneAndUpdate(
            { owner: req.user._id, category, month },
            { limit, alertThreshold: alertThreshold || 80 },
            { upsert: true, new: true, runValidators: true }
        ).populate('category', 'name icon color slug');
        res.status(201).json({ budget });
    } catch (err) { next(err); }
};

// PUT /api/budgets/:id
export const updateBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            req.body,
            { new: true }
        ).populate('category', 'name icon color slug');
        if (!budget) return res.status(404).json({ message: 'Budget not found' });
        res.json({ budget });
    } catch (err) { next(err); }
};

// DELETE /api/budgets/:id
export const deleteBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!budget) return res.status(404).json({ message: 'Budget not found' });
        res.json({ message: 'Budget deleted' });
    } catch (err) { next(err); }
};
