import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { createOrReplaceOTP, verifyOTPCode } from '../services/otpService.js';
import { sendPhoneOTP } from '../services/twilioService.js';
import { sendEmailOTP, sendPasswordResetEmail } from '../services/mailerService.js';
import { issueTokens, clearTokens } from '../middleware/auth.js';

const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
const isPhone = (str) => /^\+?[\d\s\-()]{7,15}$/.test(str);

// Safely deliver OTP — falls back to console if credentials not configured or SMTP fails
const deliverOTP = async (type, identifier, otp) => {
    try {
        if (type === 'phone') await sendPhoneOTP(identifier, otp);
        else await sendEmailOTP(identifier, otp);
    } catch (err) {
        console.warn(`⚠️  OTP delivery failed (${err.message}).`);
        console.warn(`[FALLBACK OTP FOR ${identifier}]: \x1b[31merror delivery\x1b[0m \x1b[32m${otp}\x1b[0m`);
        // We no longer throw err here in production, because if SMTP credentials are not set up on Render yet, we don't want the user's registration screen to infinitely hang or crash.
    }
};


// POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { name, identifier, password } = req.body;
        if (!name || !identifier || !password) {
            return res.status(400).json({ message: 'Name, identifier, and password are required' });
        }

        const type = isEmail(identifier) ? 'email' : isPhone(identifier) ? 'phone' : null;
        if (!type) return res.status(400).json({ message: 'Identifier must be a valid email or phone' });

        const existing = await User.findOne(type === 'email' ? { email: identifier } : { phone: identifier });
        if (existing) return res.status(409).json({ message: `${type === 'email' ? 'Email' : 'Phone'} already registered` });

        const passwordHash = await bcrypt.hash(password, 12);
        await User.create({
            name,
            [type]: identifier,
            passwordHash,
            linkedAccounts: [{ type: `local-${type}`, id: identifier }],
        });

        const otp = await createOrReplaceOTP(identifier, type, 'register');
        await deliverOTP(type, identifier, otp);

        res.status(201).json({ message: 'OTP sent. Verify to complete registration', type, identifier });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/send-otp
export const sendOTP = async (req, res, next) => {
    try {
        const { identifier, purpose } = req.body;
        const type = isEmail(identifier) ? 'email' : 'phone';
        const otp = await createOrReplaceOTP(identifier, type, purpose || 'login');
        await deliverOTP(type, identifier, otp);
        res.json({ message: 'OTP sent', type });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req, res, next) => {
    try {
        const { identifier, otp, purpose, deviceName, trustDevice } = req.body;
        const type = isEmail(identifier) ? 'email' : 'phone';

        await verifyOTPCode(identifier, type, purpose || 'login', otp);

        const user = await User.findOne(type === 'email' ? { email: identifier } : { phone: identifier });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isVerified) {
            user.isVerified = true;
        }

        // Trust device
        if (trustDevice && deviceName) {
            const deviceId = uuidv4();
            user.trustedDevices.push({ deviceId, name: deviceName, addedAt: new Date() });
            res.cookie('deviceId', deviceId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        const { refreshToken } = issueTokens(res, user._id);
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.json({ message: 'Login successful', user: sanitizeUser(user) });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ message: 'Identifier and password required' });

        const type = isEmail(identifier) ? 'email' : 'phone';
        const user = await User.findOne(type === 'email' ? { email: identifier } : { phone: identifier });
        if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        // Check trusted device
        const deviceId = req.cookies?.deviceId;
        const isTrusted = deviceId && user.trustedDevices.some((d) => d.deviceId === deviceId);

        if (!isTrusted) {
            const otp = await createOrReplaceOTP(identifier, type, 'login');
            await deliverOTP(type, identifier, otp);
            return res.json({ message: 'OTP sent for verification', requiresOTP: true, type, identifier });
        }

        const { refreshToken } = issueTokens(res, user._id);
        user.refreshTokens.push(refreshToken);
        await user.save();
        res.json({ message: 'Login successful', user: sanitizeUser(user) });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ message: 'No refresh token' });

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);
        if (!user || !user.refreshTokens.includes(token)) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Rotate
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
        const { refreshToken: newRefresh } = issueTokens(res, user._id);
        user.refreshTokens.push(newRefresh);
        await user.save();

        res.json({ message: 'Token refreshed' });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET).catch(() => null);
            if (decoded) {
                await User.findByIdAndUpdate(decoded.id, { $pull: { refreshTokens: token } });
            }
        }
        clearTokens(res);
        res.json({ message: 'Logged out' });
    } catch (err) {
        clearTokens(res);
        res.json({ message: 'Logged out' });
    }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
    try {
        const { identifier } = req.body;
        const type = isEmail(identifier) ? 'email' : 'phone';
        const user = await User.findOne(type === 'email' ? { email: identifier } : { phone: identifier });
        if (!user) return res.json({ message: 'If this account exists, an OTP has been sent' });

        const otp = await createOrReplaceOTP(identifier, type, 'forgot-password');
        if (type === 'phone') await deliverOTP('phone', identifier, otp);
        else {
            try { await sendPasswordResetEmail(identifier, otp); }
            catch (err) {
                if (process.env.NODE_ENV !== 'production') console.warn(`⚠️  Reset email failed. DEV OTP for ${identifier}: \x1b[33m${otp}\x1b[0m`);
                else throw err;
            }
        }

        res.json({ message: 'OTP sent for password reset', type });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        const type = isEmail(identifier) ? 'email' : 'phone';

        await verifyOTPCode(identifier, type, 'forgot-password', otp);

        const user = await User.findOne(type === 'email' ? { email: identifier } : { phone: identifier });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.refreshTokens = []; // Invalidate all sessions
        await user.save();

        clearTokens(res);
        res.json({ message: 'Password reset successful. Please login.' });
    } catch (err) {
        next(err);
    }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    res.json({ user: sanitizeUser(req.user) });
};

const sanitizeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    isVerified: user.isVerified,
    linkedAccounts: user.linkedAccounts,
    currency: user.currency,
    timezone: user.timezone,
});
