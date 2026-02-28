import mongoose from 'mongoose';

const linkedAccountSchema = new mongoose.Schema({
    type: { type: String, enum: ['google', 'local-email', 'local-phone'] },
    id: String,
}, { _id: false });

const trustedDeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    name: String,
    addedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    passwordHash: String,
    googleId: { type: String, sparse: true },
    avatar: String,
    isVerified: { type: Boolean, default: false },
    linkedAccounts: [linkedAccountSchema],
    trustedDevices: [trustedDeviceSchema],
    refreshTokens: [String],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    lastActiveAt: Date,
}, { timestamps: true });

// Ensure at least email or phone
userSchema.pre('save', function (next) {
    if (!this.email && !this.phone && !this.googleId) {
        return next(new Error('User must have email, phone, or googleId'));
    }
    next();
});

const User = mongoose.model('User', userSchema);
export default User;
