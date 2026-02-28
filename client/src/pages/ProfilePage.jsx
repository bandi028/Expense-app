import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Shield, Smartphone, Download, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation,
    useRequestChangeEmailMutation, useChangeEmailMutation,
    useRequestChangePhoneMutation, useChangePhoneMutation,
    useGetDevicesQuery, useRemoveDeviceMutation, useDeleteAccountMutation,
} from '../api/otherApis.js';
import { logout } from '../features/auth/authSlice.js';

export default function ProfilePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data } = useGetProfileQuery();
    const { data: devicesData } = useGetDevicesQuery();
    const user = data?.user;

    const [updateProfile] = useUpdateProfileMutation();
    const [changePassword] = useChangePasswordMutation();
    const [requestChangeEmail] = useRequestChangeEmailMutation();
    const [changeEmail] = useChangeEmailMutation();
    const [requestChangePhone] = useRequestChangePhoneMutation();
    const [changePhone] = useChangePhoneMutation();
    const [removeDevice] = useRemoveDeviceMutation();
    const [deleteAccount] = useDeleteAccountMutation();

    const [nameForm, setNameForm] = useState({ name: '', currency: 'INR' });
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [emailForm, setEmailForm] = useState({ newEmail: '', otp: '', otpSent: false });
    const [phoneForm, setPhoneForm] = useState({ newPhone: '', otp: '', otpSent: false });
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        if (nameForm.name) fd.append('name', nameForm.name);
        if (nameForm.currency) fd.append('currency', nameForm.currency);
        try {
            await updateProfile(fd).unwrap();
            toast.success('Profile updated!');
        } catch (err) { toast.error(err.data?.message || 'Failed'); }
    };

    const handleChangePass = async (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirm) return toast.error('Passwords do not match');
        try {
            await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }).unwrap();
            toast.success('Password changed. Please login again.');
            dispatch(logout());
            navigate('/login');
        } catch (err) { toast.error(err.data?.message || 'Failed'); }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount().unwrap();
            dispatch(logout());
            navigate('/login');
            toast.success('Account deleted');
        } catch (err) { toast.error(err.data?.message || 'Failed'); }
    };

    const handleExport = (type) => {
        window.location.href = `/api/expenses/export/${type}`;
    };

    const handleEmailRequest = async (e) => {
        e.preventDefault();
        try {
            await requestChangeEmail({ newEmail: emailForm.newEmail }).unwrap();
            setEmailForm({ ...emailForm, otpSent: true });
            toast.success('OTP sent to new email');
        } catch (err) { toast.error(err.data?.message || 'Failed to send OTP'); }
    };

    const handleEmailVerify = async (e) => {
        e.preventDefault();
        try {
            await changeEmail({ newEmail: emailForm.newEmail, otp: emailForm.otp }).unwrap();
            toast.success('Email linked successfully');
            setEmailForm({ newEmail: '', otp: '', otpSent: false });
        } catch (err) { toast.error(err.data?.message || 'Invalid OTP'); }
    };

    const handlePhoneRequest = async (e) => {
        e.preventDefault();
        try {
            await requestChangePhone({ newPhone: phoneForm.newPhone }).unwrap();
            setPhoneForm({ ...phoneForm, otpSent: true });
            toast.success('OTP sent to new phone');
        } catch (err) { toast.error(err.data?.message || 'Failed to send OTP'); }
    };

    const handlePhoneVerify = async (e) => {
        e.preventDefault();
        try {
            await changePhone({ newPhone: phoneForm.newPhone, otp: phoneForm.otp }).unwrap();
            toast.success('Phone linked successfully');
            setPhoneForm({ newPhone: '', otp: '', otpSent: false });
        } catch (err) { toast.error(err.data?.message || 'Invalid OTP'); }
    };

    return (
        <div>
            <div className="topbar">
                <div className="topbar-title">Profile</div>
            </div>
            <div className="page-content" style={{ maxWidth: 720 }}>
                {/* Profile Info */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        {user?.avatar
                            ? <img src={user.avatar} alt={user?.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', border: '3px solid var(--accent)' }}>
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                        }
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.name}</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{user?.email || user?.phone}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                {user?.linkedAccounts?.map((a) => (
                                    <span key={a.type} className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontSize: 11 }}>
                                        {a.type === 'google' ? '🔵 Google' : a.type === 'local-email' ? '📧 Email' : '📱 Phone'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-grid" style={{ marginBottom: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Display Name</label>
                                <input className="form-input" placeholder={user?.name} value={nameForm.name}
                                    onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select className="form-select" value={nameForm.currency} onChange={(e) => setNameForm({ ...nameForm, currency: e.target.value })}>
                                    <option value="INR">₹ INR</option>
                                    <option value="USD">$ USD</option>
                                    <option value="EUR">€ EUR</option>
                                    <option value="GBP">£ GBP</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Shield size={16} style={{ color: 'var(--accent)' }} /> Change Password
                    </h3>
                    <form onSubmit={handleChangePass}>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label className="form-label">Current Password</label>
                            <input className="form-input" type="password" value={passForm.currentPassword}
                                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
                        </div>
                        <div className="form-grid" style={{ marginBottom: 16 }}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input className="form-input" type="password" placeholder="Min. 8 characters" value={passForm.newPassword}
                                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input className="form-input" type="password" value={passForm.confirm}
                                    onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} required />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
                    </form>
                </div>

                {/* Account Linking */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <User size={16} style={{ color: 'var(--accent)' }} /> Link Accounts
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                        Link your email or phone number to sign in seamlessly and prevent duplicate accounts.
                    </p>

                    <div className="form-grid" style={{ marginBottom: 16 }}>
                        {/* Email Link Form */}
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 'var(--radius-lg)' }}>
                            <label className="form-label">Email Address</label>
                            {!emailForm.otpSent ? (
                                <form onSubmit={handleEmailRequest} style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" type="email" placeholder="email@example.com" value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} required style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn-secondary btn-sm">Send OTP</button>
                                </form>
                            ) : (
                                <form onSubmit={handleEmailVerify} style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" type="text" placeholder="Enter OTP" value={emailForm.otp} onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value })} required style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Verify & Link</button>
                                </form>
                            )}
                        </div>

                        {/* Phone Link Form */}
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 'var(--radius-lg)' }}>
                            <label className="form-label">Phone Number</label>
                            {!phoneForm.otpSent ? (
                                <form onSubmit={handlePhoneRequest} style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" type="tel" placeholder="+919876543210" value={phoneForm.newPhone} onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })} required style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn-secondary btn-sm">Send OTP</button>
                                </form>
                            ) : (
                                <form onSubmit={handlePhoneVerify} style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" type="text" placeholder="Enter OTP" value={phoneForm.otp} onChange={(e) => setPhoneForm({ ...phoneForm, otp: e.target.value })} required style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Verify & Link</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trusted Devices */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Smartphone size={16} style={{ color: 'var(--accent)' }} /> Trusted Devices
                    </h3>
                    {!devicesData?.devices?.length && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No trusted devices. Trust a device on next login to skip OTP.</p>}
                    {devicesData?.devices?.map((d) => (
                        <div key={d.deviceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name || 'Unknown device'}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Added {new Date(d.addedAt).toLocaleDateString()}</div>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={async () => { await removeDevice(d.deviceId); toast.success('Device removed'); }}>
                                <Trash2 size={13} /> Remove
                            </button>
                        </div>
                    ))}
                </div>

                {/* Export */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Download size={16} style={{ color: 'var(--accent)' }} /> Export Data
                    </h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => handleExport('csv')}><Download size={14} /> Export CSV</button>
                        <button className="btn btn-secondary" onClick={() => handleExport('pdf')}><Download size={14} /> Export PDF</button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <AlertTriangle size={16} /> Danger Zone
                    </h3>
                    {!confirmDelete
                        ? <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete Account</button>
                        : (
                            <div>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                    This will permanently delete your account and all data. This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                                    <button className="btn btn-danger" onClick={handleDeleteAccount}>Yes, Delete My Account</button>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
