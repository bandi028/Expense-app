import Category from '../models/Category.js';

// 15 predefined categories — auto-seeded on first GET if DB is empty
const PREDEFINED = [
    { name: 'Food & Dining', slug: 'food', icon: '🍔', color: '#f59e0b' },
    { name: 'Transport', slug: 'transport', icon: '🚗', color: '#3b82f6' },
    { name: 'Shopping', slug: 'shopping', icon: '🛍️', color: '#ec4899' },
    { name: 'Health & Medical', slug: 'health', icon: '💊', color: '#10b981' },
    { name: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#8b5cf6' },
    { name: 'Utilities', slug: 'utilities', icon: '💡', color: '#06b6d4' },
    { name: 'Education', slug: 'education', icon: '📚', color: '#f97316' },
    { name: 'Travel', slug: 'travel', icon: '✈️', color: '#14b8a6' },
    { name: 'Groceries', slug: 'groceries', icon: '🛒', color: '#84cc16' },
    { name: 'Personal Care', slug: 'personal-care', icon: '🧴', color: '#f43f5e' },
    { name: 'Housing', slug: 'housing', icon: '🏠', color: '#6366f1' },
    { name: 'Subscriptions', slug: 'subscriptions', icon: '📺', color: '#a855f7' },
    { name: 'Insurance', slug: 'insurance', icon: '🛡️', color: '#0ea5e9' },
    { name: 'Gifts & Donations', slug: 'gifts', icon: '🎁', color: '#ef4444' },
    { name: 'Other', slug: 'other', icon: '📦', color: '#78716c' },
];

// Ensure predefined categories exist in DB (idempotent)
const ensurePredefined = async () => {
    const count = await Category.countDocuments({ isDefault: true, owner: null });
    if (count < PREDEFINED.length) {
        await Promise.all(
            PREDEFINED.map((cat) =>
                Category.findOneAndUpdate(
                    { slug: cat.slug, owner: null },
                    { ...cat, isDefault: true, owner: null },
                    { upsert: true, new: true }
                )
            )
        );
    }
};

// GET /api/categories — returns predefined + user's custom categories
export const getCategories = async (req, res, next) => {
    try {
        await ensurePredefined();
        const categories = await Category.find({
            $or: [{ owner: null }, { owner: req.user._id }],
        }).sort({ isDefault: -1, name: 1 });
        res.json({ categories });
    } catch (err) { next(err); }
};

// POST /api/categories — create a custom category
export const createCategory = async (req, res, next) => {
    try {
        const { name, icon, color } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${req.user._id.toString().slice(-4)}`;
        const cat = await Category.create({ name, slug, icon: icon || '📦', color: color || '#6366f1', owner: req.user._id });
        res.status(201).json({ category: cat });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'Category with this name already exists' });
        next(err);
    }
};

// PUT /api/categories/:id — update a custom category (user can't edit predefined)
export const updateCategory = async (req, res, next) => {
    try {
        const { name, icon, color } = req.body;
        const update = {};
        if (name) { update.name = name; update.slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${req.user._id.toString().slice(-4)}`; }
        if (icon) update.icon = icon;
        if (color) update.color = color;

        const cat = await Category.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id }, // only user's own
            update,
            { new: true }
        );
        if (!cat) return res.status(404).json({ message: 'Category not found or is predefined' });
        res.json({ category: cat });
    } catch (err) { next(err); }
};

// DELETE /api/categories/:id — delete a custom category (predefined are protected)
export const deleteCategory = async (req, res, next) => {
    try {
        const cat = await Category.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!cat) return res.status(404).json({ message: 'Category not found or cannot delete a predefined category' });
        res.json({ message: 'Category deleted' });
    } catch (err) { next(err); }
};
