import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { useLoginMutation, useSendOtpMutation } from '../api/authApi.js';
import { setUser, setOtpPending } from '../features/auth/authSlice.js';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [mode, setMode] = useState('email'); // 'email' | 'phone'
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ identifier: '', password: '' });

    const [login, { isLoading }] = useLoginMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login(form).unwrap();
            if (res.requiresOTP) {
                dispatch(setOtpPending({ identifier: form.identifier, type: res.type, purpose: 'login' }));
                navigate('/otp');
            } else {
                dispatch(setUser(res.user));
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.data?.message || 'Login failed');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/google';
    };

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💳</div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>ExpenseTrack</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to manage your expenses</p>

                <button className="btn-google" onClick={handleGoogleLogin}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 2.9L37.3 10C33.8 6.9 29.1 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.4-4z" />
                        <path fill="#FF3D00" d="M6.3 15.2l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 2.9L37.3 10C33.8 6.9 29.1 5 24 5c-7.6 0-14.2 4.1-17.7 10.2z" />
                        <path fill="#4CAF50" d="M24 47c5.2 0 10-.9 14-2.9l-6.5-5.3C29.7 40.1 27 41 24 41c-5.2 0-9.7-3.5-11.3-8.3l-6.6 5.1C9.7 43.2 16.4 47 24 47z" />
                        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.1-2.1 3.9-3.9 5.3l6.5 5.3C41.9 35.3 44 30.4 44 26c0-1.3-.1-2.7-.4-6z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-divider" style={{ margin: '16px 0' }}>
                    <span>or continue with</span>
                </div>

                <div className="tab-toggle" style={{ marginBottom: 16 }}>
                    <button className={`tab-btn ${mode === 'email' ? 'active' : ''}`} onClick={() => setMode('email')}>
                        <Mail size={14} style={{ display: 'inline', marginRight: 5 }} />Email
                    </button>
                    <button className={`tab-btn ${mode === 'phone' ? 'active' : ''}`} onClick={() => setMode('phone')}>
                        <Phone size={14} style={{ display: 'inline', marginRight: 5 }} />Phone
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{mode === 'email' ? 'Email' : 'Phone Number'}</label>
                        <input
                            className="form-input"
                            type={mode === 'email' ? 'email' : 'tel'}
                            placeholder={mode === 'email' ? 'you@example.com' : '+91 9999999999'}
                            value={form.identifier}
                            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: -8 }}>
                        <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)' }}>Forgot password?</Link>
                    </div>

                    <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-sm text-muted text-center" style={{ marginTop: 20 }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
}
