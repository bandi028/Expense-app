import mongoose from 'mongoose';

const attemptsSchema = new mongoose.Schema({
    count: { type: Number, default: 0 },
    lockedUntil: Date,
}, { _id: false });

const otpSchema = new mongoose.Schema({
    identifier: { type: String, required: true },
    type: { type: String, enum: ['phone', 'email'], required: true },
    purpose: { type: String, enum: ['login', 'register', 'forgot-password', 'change-email', 'change-phone'], required: true },
    otpHash: { type: String, required: true },
    attempts: { type: attemptsSchema, default: {} },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

// TTL index — MongoDB auto deletes document after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ identifier: 1, type: 1, purpose: 1 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
