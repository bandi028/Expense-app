import express from 'express';
import passport from 'passport';
import * as auth from '../controllers/authController.js';
import { protect, issueTokens, clearTokens } from '../middleware/auth.js';
import { otpSendLimiter, otpVerifyLimiter, loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', auth.register);
router.post('/send-otp', auth.sendOTP);
router.post('/verify-otp', auth.verifyOTP);
router.post('/login', auth.login);
router.post('/refresh', auth.refreshToken);
router.post('/logout', auth.logout);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.get('/me', protect, auth.getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
    async (req, res) => {
        try {
            const user = req.user;
            const { refreshToken } = issueTokens(res, user._id);
            user.refreshTokens.push(refreshToken);
            await user.save();
            res.redirect(`${process.env.CLIENT_URL}/dashboard`);
        } catch {
            clearTokens(res);
            res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
        }
    }
);

export default router;
