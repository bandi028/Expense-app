import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import { createOrReplaceOTP, verifyOTPCode } from '../services/otpService.js';
import { sendEmailOTP } from '../services/mailerService.js';
import { sendPhoneOTP } from '../services/twilioService.js';
import cloudinary from '../config/cloudinary.js';

// GET /api/profile
export const getProfile = async (req, res) => {
    const user = req.user;
    res.json({
        user: {
            _id: user._id, name: user.name, email: user.email, phone: user.phone,
            avatar: user.avatar, isVerified: user.isVerified,
            linkedAccounts: user.linkedAccounts, trustedDevices: user.trustedDevices,
            currency: user.currency, timezone: user.timezone, createdAt: user.createdAt,
        },
    });
};

// PUT /api/profile
export const updateProfile = async (req, res, next) => {
    try {
        const { name, currency, timezone } = req.body;
        let avatar = req.user.avatar;
        if (req.file) avatar = req.file.path;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, currency, timezone, avatar },
            { new: true, runValidators: true }
        );
        res.json({ user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
    } catch (err) { next(err); }
};

// POST /api/profile/change-password
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user.passwordHash) return res.status(400).json({ message: 'No password set (OAuth account)' });

        const match = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.refreshTokens = [];
        await user.save();
        res.json({ message: 'Password changed. Please log in again.' });
    } catch (err) { next(err); }
};

// POST /api/profile/request-change-email
export const requestChangeEmail = async (req, res, next) => {
    try {
        const { newEmail } = req.body;
        const existing = await User.findOne({ email: newEmail });
        if (existing) return res.status(409).json({ message: 'Email already in use' });
        const otp = await createOrReplaceOTP(newEmail, 'email', 'change-email');
        await sendEmailOTP(newEmail, otp);
        res.json({ message: 'OTP sent to new email' });
    } catch (err) { next(err); }
};

// POST /api/profile/change-email
export const changeEmail = async (req, res, next) => {
    try {
        const { newEmail, otp } = req.body;
        await verifyOTPCode(newEmail, 'email', 'change-email', otp);
        const user = await User.findById(req.user._id);
        user.email = newEmail;
        user.linkedAccounts = user.linkedAccounts.filter(a => a.type !== 'local-email');
        user.linkedAccounts.push({ type: 'local-email', id: newEmail });
        await user.save();
        res.json({ message: 'Email updated' });
    } catch (err) { next(err); }
};

// POST /api/profile/request-change-phone
export const requestChangePhone = async (req, res, next) => {
    try {
        const { newPhone } = req.body;
        const existing = await User.findOne({ phone: newPhone });
        if (existing) return res.status(409).json({ message: 'Phone already in use' });
        const otp = await createOrReplaceOTP(newPhone, 'phone', 'change-phone');
        await sendPhoneOTP(newPhone, otp);
        res.json({ message: 'OTP sent to new phone' });
    } catch (err) { next(err); }
};

// POST /api/profile/change-phone
export const changePhone = async (req, res, next) => {
    try {
        const { newPhone, otp } = req.body;
        await verifyOTPCode(newPhone, 'phone', 'change-phone', otp);
        const user = await User.findById(req.user._id);
        user.phone = newPhone;
        user.linkedAccounts = user.linkedAccounts.filter(a => a.type !== 'local-phone');
        user.linkedAccounts.push({ type: 'local-phone', id: newPhone });
        await user.save();
        res.json({ message: 'Phone updated' });
    } catch (err) { next(err); }
};

// GET /api/profile/devices
export const getDevices = async (req, res) => {
    res.json({ devices: req.user.trustedDevices });
};

// DELETE /api/profile/devices/:deviceId
export const removeDevice = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { trustedDevices: { deviceId: req.params.deviceId } },
        });
        res.json({ message: 'Trusted device removed' });
    } catch (err) { next(err); }
};

// DELETE /api/profile
export const deleteAccount = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            isDeleted: true,
            deletedAt: new Date(),
            refreshTokens: [],
        });
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({ message: 'Account deleted' });
    } catch (err) { next(err); }
};
