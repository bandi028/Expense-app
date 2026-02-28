import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { useRegisterMutation } from '../api/authApi.js';
import { setOtpPending } from '../features/auth/authSlice.js';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [mode, setMode] = useState('email');
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ name: '', identifier: '', password: '' });
    const [register, { isLoading }] = useRegisterMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
        try {
            const res = await register({ name: form.name, identifier: form.identifier, password: form.password }).unwrap();
            dispatch(setOtpPending({ identifier: form.identifier, type: res.type, purpose: 'register' }));
            toast.success('OTP sent! Check your ' + (res.type === 'email' ? 'email' : 'phone'));
            navigate('/otp');
        } catch (err) {
            toast.error(err.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💳</div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>ExpenseTrack</span>
                </div>
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start tracking your expenses today</p>

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
                        <label className="form-label">Full Name</label>
                        <input className="form-input" placeholder="John Doe" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{mode === 'email' ? 'Email' : 'Phone Number'}</label>
                        <input className="form-input" type={mode === 'email' ? 'email' : 'tel'}
                            placeholder={mode === 'email' ? 'you@example.com' : '+91 9999999999'}
                            value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-sm text-muted text-center" style={{ marginTop: 20 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
