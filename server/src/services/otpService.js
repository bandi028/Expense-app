import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export const generateOTP = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

export const createOrReplaceOTP = async (identifier, type, purpose) => {
    const existing = await OTP.findOne({ identifier, type, purpose });

    if (existing) {
        const cooldownLeft = existing.lastSentAt
            ? RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())
            : 0;
        if (cooldownLeft > 0) {
            throw Object.assign(new Error('Please wait before requesting another OTP'), {
                status: 429,
                cooldownLeft: Math.ceil(cooldownLeft / 1000),
            });
        }
        await OTP.deleteOne({ _id: existing._id });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await OTP.create({ identifier, type, purpose, otpHash, expiresAt, lastSentAt: new Date() });
    return otp;
};

export const verifyOTPCode = async (identifier, type, purpose, plain) => {
    const record = await OTP.findOne({ identifier, type, purpose });

    if (!record) throw Object.assign(new Error('OTP not found or expired'), { status: 400 });

    const now = new Date();
    if (record.expiresAt < now) {
        await OTP.deleteOne({ _id: record._id });
        throw Object.assign(new Error('OTP has expired'), { status: 400 });
    }

    // Check lockout
    if (record.attempts.lockedUntil && record.attempts.lockedUntil > now) {
        const wait = Math.ceil((record.attempts.lockedUntil - now) / 60000);
        throw Object.assign(new Error(`Too many attempts. Try again in ${wait} min`), { status: 429 });
    }

    const isValid = await bcrypt.compare(plain, record.otpHash);

    if (!isValid) {
        record.attempts.count += 1;
        if (record.attempts.count >= MAX_ATTEMPTS) {
            record.attempts.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        }
        await record.save();
        const remaining = MAX_ATTEMPTS - record.attempts.count;
        throw Object.assign(
            new Error(`Invalid OTP. ${remaining > 0 ? `${remaining} attempts remaining` : 'Account locked'}`),
            { status: 400 }
        );
    }

    await OTP.deleteOne({ _id: record._id });
    return true;
};
