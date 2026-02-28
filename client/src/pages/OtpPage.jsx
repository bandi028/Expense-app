import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useVerifyOtpMutation, useSendOtpMutation } from '../api/authApi.js';
import { setUser, clearOtpPending } from '../features/auth/authSlice.js';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const OTP_TTL = 5 * 60;
const RESEND_COOLDOWN = 30;

export default function OtpPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { otpTarget, otpType, otpPurpose } = useSelector((s) => s.auth);

    const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
    const [timeLeft, setTimeLeft] = useState(OTP_TTL);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
    const refs = useRef([]);

    const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
    const [sendOtp] = useSendOtpMutation();

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (cooldown > 0) {
            const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [cooldown]);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleChange = (i, val) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...digits];
        next[i] = val.slice(-1);
        setDigits(next);
        if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (pasted.length) {
            setDigits([...pasted.split(''), ...Array(OTP_LENGTH - pasted.length).fill('')]);
            refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otp = digits.join('');
        if (otp.length < OTP_LENGTH) return toast.error('Enter all 6 digits');
        try {
            const res = await verifyOtp({ identifier: otpTarget, otp, purpose: otpPurpose }).unwrap();
            dispatch(setUser(res.user));
            dispatch(clearOtpPending());
            toast.success('Verified! Welcome 👋');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.data?.message || 'Invalid OTP');
            setDigits(Array(OTP_LENGTH).fill(''));
            refs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        try {
            await sendOtp({ identifier: otpTarget, purpose: otpPurpose }).unwrap();
            setCooldown(RESEND_COOLDOWN);
            setTimeLeft(OTP_TTL);
            toast.success('OTP resent!');
        } catch (err) {
            toast.error(err.data?.message || 'Failed to resend');
        }
    };

    const maskedTarget = otpTarget
        ? otpType === 'email'
            ? otpTarget.replace(/(.{2}).+(@.+)/, '$1****$2')
            : otpTarget.replace(/(\+?\d{2})\d+(\d{4})/, '$1****$2')
        : '';

    return (
        <div className="auth-page">
            <div className="auth-card fade-in" style={{ maxWidth: 400 }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">🔐</div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Verify OTP</span>
                </div>
                <h1 className="auth-title" style={{ fontSize: 20 }}>Enter verification code</h1>
                <p className="auth-subtitle">
                    A 6-digit code was sent to <strong style={{ color: 'var(--text-primary)' }}>{maskedTarget}</strong>
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="otp-container" onPaste={handlePaste} style={{ marginBottom: 24 }}>
                        {digits.map((d, i) => (
                            <input key={i} ref={(el) => (refs.current[i] = el)} className="otp-input"
                                type="text" inputMode="numeric" maxLength={1}
                                value={d} onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)} />
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <span style={{ fontSize: 13, color: timeLeft < 60 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            {timeLeft > 0 ? `Expires in ${fmt(timeLeft)}` : 'OTP expired'}
                        </span>
                    </div>

                    <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={handleResend} disabled={cooldown > 0}
                        style={{ background: 'none', border: 'none', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', color: cooldown > 0 ? 'var(--text-muted)' : 'var(--accent)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                </div>
            </div>
        </div>
    );
}
