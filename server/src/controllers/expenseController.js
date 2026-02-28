import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import { extractFromReceipt, suggestCategoryFromText } from '../services/ocrService.js';
import cloudinary from '../config/cloudinary.js';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import fs from 'fs';


// Inline CSV builder (avoids CJS csv-writer ESM compat issues)
const buildCSV = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [
        headers.map(escape).join(','),
        ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
    ].join('\n');
};


const buildFilter = (userId, query) => {
    const filter = { owner: userId, isDeleted: false };
    if (query.category) filter.category = query.category;
    if (query.dateFrom || query.dateTo) {
        filter.date = {};
        if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
        if (query.dateTo) {
            // Set to end of the day to ensure boundary inclusivity
            filter.date.$lte = dayjs(query.dateTo).endOf('day').toDate();
        }
    }
    return filter;
};

// GET /api/expenses
export const getExpenses = async (req, res, next) => {
    try {
        const filter = buildFilter(req.user._id, req.query);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .populate('category', 'name icon color slug')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
            Expense.countDocuments(filter),
        ]);

        res.json({ expenses, total, page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

// POST /api/expenses
export const createExpense = async (req, res, next) => {
    try {
        const expense = await Expense.create({ ...req.body, owner: req.user._id });
        await expense.populate('category', 'name icon color slug');
        await updateBudgetSpent(req.user._id, expense.category._id, expense.date);
        res.status(201).json({ expense });
    } catch (err) { next(err); }
};

// PUT /api/expenses/:id
export const updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id, isDeleted: false },
            req.body,
            { new: true, runValidators: true }
        ).populate('category', 'name icon color slug');
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json({ expense });
    } catch (err) { next(err); }
};

// DELETE /api/expenses/:id — soft delete
export const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense deleted', expense });
    } catch (err) { next(err); }
};

// POST /api/expenses/restore/:id — undo delete
export const restoreExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id, isDeleted: true },
            { isDeleted: false, deletedAt: null },
            { new: true }
        ).populate('category', 'name icon color slug');
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense restored', expense });
    } catch (err) { next(err); }
};

// DELETE /api/expenses/bulk
export const bulkDeleteExpenses = async (req, res, next) => {
    try {
        const { ids } = req.body;
        await Expense.updateMany(
            { _id: { $in: ids }, owner: req.user._id },
            { isDeleted: true, deletedAt: new Date() }
        );
        res.json({ message: `${ids.length} expenses deleted` });
    } catch (err) { next(err); }
};

// POST /api/expenses/upload-receipt
export const uploadReceipt = async (req, res, next) => {
    const localPath = req.file?.path;
    try {
        if (!req.file || !localPath) return res.status(400).json({ message: 'No file uploaded' });

        const isPdf = req.file.mimetype === 'application/pdf';

        // Step 1: Run OCR on local file (before uploading to Cloudinary)
        const extracted = await extractFromReceipt(localPath);

        // Step 2: Upload original file to Cloudinary
        const cloudResult = await cloudinary.uploader.upload(localPath, {
            folder: 'expense-receipts',
            resource_type: isPdf ? 'raw' : 'image',
            ...(isPdf ? {} : { transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }] }),
        });

        // Step 3: Find matching category
        let categoryId = null;
        if (extracted.category) {
            const cat = await Category.findOne({
                slug: extracted.category,
                $or: [{ owner: null }, { owner: req.user._id }],
            });
            if (cat) categoryId = cat._id;
        }

        res.json({
            receiptUrl: cloudResult.secure_url,
            receiptPublicId: cloudResult.public_id,
            extracted: { ...extracted, categoryId },
        });
    } catch (err) {
        next(err);
    } finally {
        // Always clean up local temp file
        if (localPath) {
            try { fs.unlinkSync(localPath); } catch (_) { /* ignore */ }
        }
    }
};


// GET /api/expenses/summary
export const getSummary = async (req, res, next) => {
    try {
        const filter = buildFilter(req.user._id, req.query);
        const [result] = await Expense.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const topCatAgg = await Expense.aggregate([
            { $match: filter },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        ]);

        const topCategory = topCatAgg[0]?.cat[0] || null;
        res.json({
            total: result?.total || 0,
            count: result?.count || 0,
            topCategory: topCategory ? { name: topCategory.name, icon: topCategory.icon, color: topCategory.color } : null,
        });
    } catch (err) { next(err); }
};

// GET /api/expenses/trend
export const getTrend = async (req, res, next) => {
    try {
        const filter = buildFilter(req.user._id, req.query);
        const data = await Expense.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({ trend: data.map((d) => ({ date: d._id, total: d.total, count: d.count })) });
    } catch (err) { next(err); }
};

// GET /api/expenses/by-category
export const getByCategory = async (req, res, next) => {
    try {
        const filter = buildFilter(req.user._id, req.query);
        const data = await Expense.aggregate([
            { $match: filter },
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' },
            { $sort: { total: -1 } },
        ]);
        res.json({
            byCategory: data.map((d) => ({
                _id: d._id,
                name: d.category.name,
                icon: d.category.icon,
                color: d.category.color,
                total: d.total,
                count: d.count,
            })),
        });
    } catch (err) { next(err); }
};

// GET /api/expenses/export/csv
export const exportCSV = async (req, res, next) => {
    try {
        const filter = buildFilter(req.user._id, req.query);
        const expenses = await Expense.find(filter).populate('category', 'name').sort({ date: -1 });

        const rows = expenses.map((e) => ({
            Date: dayjs(e.date).format('YYYY-MM-DD'),
            Title: e.title,
            Category: e.category?.name || '',
            Amount: e.amount,
            Currency: e.currency,
            Description: e.description,
        }));

        const csv = buildCSV(rows);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
        res.send(csv);
    } catch (err) { next(err); }
};

// GET /api/expenses/export/pdf
export const exportPDF = async (req, res, next) => {
    try {
        const filter = buildFilter(req.user._id, req.query);
        const expenses = await Expense.find(filter).populate('category', 'name').sort({ date: -1 });
        const total = expenses.reduce((s, e) => s + e.amount, 0);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.pdf');
        doc.pipe(res);

        doc.fontSize(18).text('Expense Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11);

        expenses.forEach((e) => {
            doc.text(
                `${dayjs(e.date).format('DD/MM/YYYY')}  |  ${e.title}  |  ${e.category?.name || ''}  |  ₹${e.amount}`,
                { continued: false }
            );
        });

        doc.moveDown();
        doc.fontSize(13).text(`Total: ₹${total}`, { align: 'right' });
        doc.end();
    } catch (err) { next(err); }
};

// Helper: Recalculate budget spent
const updateBudgetSpent = async (userId, categoryId, date) => {
    const month = dayjs(date).format('YYYY-MM');
    const start = dayjs(month).startOf('month').toDate();
    const end = dayjs(month).endOf('month').toDate();

    const [agg] = await Expense.aggregate([
        { $match: { owner: userId, category: categoryId, isDeleted: false, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    await Budget.findOneAndUpdate(
        { owner: userId, category: categoryId, month },
        { $set: { spent: agg?.total || 0 } }
    );
};
