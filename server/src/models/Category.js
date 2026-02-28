import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    icon: { type: String, default: '📦' },
    color: { type: String, default: '#6366f1' },
    isDefault: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    budget: {
        limit: { type: Number, default: 0 },
        alertThreshold: { type: Number, default: 80 }, // percentage
    },
}, { timestamps: true });

categorySchema.index({ slug: 1, owner: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
