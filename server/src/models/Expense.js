import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, trim: true, default: '' },
    receiptUrl: String,
    receiptPublicId: String,
    ocrExtracted: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
}, { timestamps: true });

expenseSchema.index({ owner: 1, date: -1 });
expenseSchema.index({ owner: 1, category: 1 });
expenseSchema.index({ owner: 1, isDeleted: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
