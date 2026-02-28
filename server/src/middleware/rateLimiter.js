import rateLimit from 'express-rate-limit';

export const otpSendLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { message: 'Too many OTP requests, please try again later' },
});

export const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many verification attempts, please try again later' },
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts, please try again later' },
});

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later' },
});
