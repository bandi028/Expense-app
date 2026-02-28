import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash -refreshTokens');
        if (!user || user.isDeleted) return res.status(401).json({ message: 'User not found' });

        // Update last active
        user.lastActiveAt = new Date();
        await user.save({ validateBeforeSave: false });

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const issueTokens = (res, userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
};

export const clearTokens = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};
