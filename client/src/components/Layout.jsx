import { Outlet, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Wallet, Tag, User, LogOut, TrendingUp } from 'lucide-react';
import { useLogoutMutation } from '../api/authApi.js';
import { logout } from '../features/auth/authSlice.js';
import toast from 'react-hot-toast';

export default function Layout() {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const [logoutApi] = useLogoutMutation();

    const handleLogout = async () => {
        try {
            await logoutApi().unwrap();
        } finally {
            dispatch(logout());
            window.location.href = '/login';
        }
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/budgets', icon: Wallet, label: 'Budgets' },
        { to: '/categories', icon: Tag, label: 'Categories' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="app-layout">
            <nav className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">💳</div>
                    <div>
                        <h2>EXPENSETRACK</h2>
                        <span>SMART FINANCE</span>
                    </div>
                </div>

                <div className="sidebar-nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Icon className="nav-icon" size={18} />
                            {label}
                        </NavLink>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <div style={{ padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user?.avatar
                            ? <img src={user.avatar} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                        }
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email || user?.phone}</div>
                        </div>
                    </div>
                    <button className="nav-link w-full" onClick={handleLogout}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
