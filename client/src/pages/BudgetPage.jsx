import { useState } from 'react';
import dayjs from 'dayjs';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetBudgetsQuery, useCreateBudgetMutation, useDeleteBudgetMutation } from '../api/otherApis.js';
import { useGetCategoriesQuery } from '../api/otherApis.js';

export default function BudgetPage() {
    const month = dayjs().format('YYYY-MM');
    const { data, isLoading } = useGetBudgetsQuery({ month });
    const { data: catData } = useGetCategoriesQuery();
    const [createBudget] = useCreateBudgetMutation();
    const [deleteBudget] = useDeleteBudgetMutation();

    const [form, setForm] = useState({ category: '', limit: '', alertThreshold: 80 });
    const [showForm, setShowForm] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createBudget({ ...form, month, limit: parseFloat(form.limit) }).unwrap();
            toast.success('Budget set!');
            setForm({ category: '', limit: '', alertThreshold: 80 });
            setShowForm(false);
        } catch (err) {
            toast.error(err.data?.message || 'Failed');
        }
    };

    return (
        <div>
            <div className="topbar">
                <div className="topbar-title">Budgets — {dayjs(month).format('MMMM YYYY')}</div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    <Plus size={14} /> Set Budget
                </button>
            </div>
            <div className="page-content">
                {showForm && (
                    <div className="card fade-in" style={{ marginBottom: 24, border: '1px solid var(--accent)', maxWidth: 520 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Set Monthly Budget</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-grid" style={{ marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                                        <option value="">Select category</option>
                                        {catData?.categories?.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Monthly Limit (₹)</label>
                                    <input className="form-input" type="number" placeholder="5000" value={form.limit}
                                        onChange={(e) => setForm({ ...form, limit: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Alert at (% of limit): <strong>{form.alertThreshold}%</strong></label>
                                <input type="range" min={50} max={100} value={form.alertThreshold}
                                    onChange={(e) => setForm({ ...form, alertThreshold: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Budget</button>
                            </div>
                        </form>
                    </div>
                )}

                {isLoading && <p style={{ color: 'var(--text-muted)' }}>Loading budgets...</p>}

                {!isLoading && !data?.budgets?.length && (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <div className="empty-title">No budgets set</div>
                        <p>Set monthly limits for each category to track your spending</p>
                    </div>
                )}

                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {data?.budgets?.map((b) => (
                        <div key={b._id} className="card fade-in">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 24 }}>{b.category.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{b.category.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            ₹{b.spent?.toLocaleString('en-IN') || 0} / ₹{b.limit.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {b.isOverspent && <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />}
                                    {b.isNearLimit && !b.isOverspent && <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />}
                                    <span style={{
                                        fontSize: 14, fontWeight: 800,
                                        color: b.isOverspent ? 'var(--danger)' : b.isNearLimit ? 'var(--warning)' : 'var(--success)',
                                    }}>{b.percentage}%</span>
                                    <button className="btn btn-danger btn-icon btn-sm" onClick={async () => { await deleteBudget(b._id); toast.success('Budget removed'); }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="progress-bar-wrap">
                                <div className="progress-bar-fill" style={{
                                    width: `${Math.min(b.percentage, 100)}%`,
                                    background: b.isOverspent ? 'var(--danger)' : b.isNearLimit ? 'var(--warning)' : b.category.color || 'var(--accent)',
                                }} />
                            </div>
                            {b.isOverspent && (
                                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
                                    ⚠️ Over budget by ₹{(b.spent - b.limit).toLocaleString('en-IN')}
                                </p>
                            )}
                            {b.isNearLimit && !b.isOverspent && (
                                <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
                                    🔔 {b.percentage}% used — nearing your limit
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
