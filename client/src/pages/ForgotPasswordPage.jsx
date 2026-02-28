import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../api/authApi.js';
import { useVerifyOtpMutation } from '../api/authApi.js';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: enter identifier, 2: OTP, 3: new password
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation();
    const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

    const handleSend = async (e) => {
        e.preventDefault();
        try {
            await forgotPassword({ identifier }).unwrap();
            toast.success('OTP sent!');
            setStep(2);
        } catch (err) {
            toast.error(err.data?.message || 'Failed to send OTP');
        }
    };

    const handleVerify = (e) => {
        e.preventDefault();
        if (otp.length < 6) return toast.error('Enter 6-digit OTP');
        setStep(3);
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
        if (passwords.new.length < 8) return toast.error('Password must be at least 8 characters');
        try {
            await resetPassword({ identifier, otp, newPassword: passwords.new }).unwrap();
            toast.success('Password reset! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.data?.message || 'Reset failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card fade-in" style={{ maxWidth: 420 }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">🔑</div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Forgot Password</span>
                </div>

                {step === 1 && (
                    <>
                        <p className="auth-subtitle">Enter your email or phone to receive a reset OTP</p>
                        <form className="auth-form" onSubmit={handleSend}>
                            <div className="form-group">
                                <label className="form-label">Email or Phone</label>
                                <input className="form-input" placeholder="you@example.com or +91..." value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={sending}>
                                {sending ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <p className="auth-subtitle">Enter the 6-digit OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{identifier}</strong></p>
                        <form className="auth-form" onSubmit={handleVerify}>
                            <div className="form-group">
                                <label className="form-label">OTP Code</label>
                                <input className="form-input" placeholder="123456" maxLength={6}
                                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required />
                            </div>
                            <button type="submit" className="btn btn-primary w-full btn-lg">Continue</button>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <p className="auth-subtitle">Create your new password</p>
                        <form className="auth-form" onSubmit={handleReset}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input className="form-input" type="password" placeholder="Min. 8 characters"
                                    value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input className="form-input" type="password" placeholder="Confirm new password"
                                    value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={resetting}>
                                {resetting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                <p className="text-sm text-muted text-center" style={{ marginTop: 20 }}>
                    <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
