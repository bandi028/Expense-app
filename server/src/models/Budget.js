import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    month: { type: String, required: true }, // Format: "2026-02"
    limit: { type: Number, required: true, min: 0 },
    alertThreshold: { type: Number, default: 80 }, // percentage before alerting
}, { timestamps: true });

budgetSchema.index({ owner: 1, category: 1, month: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
