import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

const predefined = [
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

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const cat of predefined) {
        await Category.findOneAndUpdate(
            { slug: cat.slug, owner: null },
            { ...cat, isDefault: true, owner: null },
            { upsert: true, new: true }
        );
    }

    console.log(`✅ Seeded ${predefined.length} predefined categories`);
    await mongoose.disconnect();
};

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
