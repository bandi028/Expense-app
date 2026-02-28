import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetMeQuery } from './api/authApi.js';
import { useDispatch } from 'react-redux';
import { setUser } from './features/auth/authSlice.js';
import { useEffect } from 'react';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OtpPage from './pages/OtpPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BudgetPage from './pages/BudgetPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import Layout from './components/Layout.jsx';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((s) => s.auth);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((s) => s.auth);
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
};

function AppInit() {
    const dispatch = useDispatch();
    const { data } = useGetMeQuery(undefined, { skip: false });
    useEffect(() => {
        if (data?.user) dispatch(setUser(data.user));
    }, [data, dispatch]);
    return null;
}

export default function App() {
    return (
        <BrowserRouter>
            <AppInit />
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/otp" element={<OtpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/budgets" element={<BudgetPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
