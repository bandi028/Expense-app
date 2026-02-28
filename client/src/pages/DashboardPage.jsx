import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Plus, Upload, Filter, Trash2, Edit2, RotateCcw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    useGetExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation,
    useDeleteExpenseMutation, useRestoreExpenseMutation, useBulkDeleteExpensesMutation,
    useUploadReceiptMutation, useGetSummaryQuery, useGetTrendQuery, useGetByCategoryQuery,
} from '../api/expenseApi.js';
import { useGetCategoriesQuery } from '../api/otherApis.js';

const DATE_PRESETS = ['This Week', 'This Month', 'Custom'];

function getPresetDates(preset) {
    const now = dayjs();
    if (preset === 'This Week') return { dateFrom: now.startOf('week').format('YYYY-MM-DD'), dateTo: now.endOf('week').format('YYYY-MM-DD') };
    if (preset === 'This Month') return { dateFrom: now.startOf('month').format('YYYY-MM-DD'), dateTo: now.endOf('month').format('YYYY-MM-DD') };
    if (preset === 'Last Month') return { dateFrom: now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), dateTo: now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD') };
    return {};
}

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#f97316', '#84cc16'];

// Generate the last 6 months list dynamically
const RECENT_MONTHS = Array.from({ length: 6 }).map((_, i) => {
    const d = dayjs().subtract(i, 'month');
    return {
        label: d.format('MMM-YY').toUpperCase(),
        dateFrom: d.startOf('month').format('YYYY-MM-DD'),
        dateTo: d.endOf('month').format('YYYY-MM-DD')
    };
});

export default function DashboardPage() {
    const [filters, setFilters] = useState({ preset: 'This Month', dateFrom: '', dateTo: '', category: '' });
    const [pendingDates, setPendingDates] = useState({ dateFrom: '', dateTo: '' });
    const [showForm, setShowForm] = useState(false);
    const [editExpense, setEditExpense] = useState(null);
    const [selected, setSelected] = useState([]);
    const [ocr, setOcr] = useState({ loading: false, data: null });

    const filterParams = useMemo(() => {
        let p = {};
        if (filters.preset === 'Custom' || RECENT_MONTHS.some(m => m.label === filters.preset)) {
            p = { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
        } else {
            p = getPresetDates(filters.preset);
        }
        if (filters.category) p.category = filters.category;
        return p;
    }, [filters]);

    const displayDateRange = useMemo(() => {
        if (!filterParams.dateFrom && !filterParams.dateTo) return 'All Time';

        // If it's a dynamic generated recent month preset
        if (RECENT_MONTHS.some(m => m.label === filters.preset)) {
            return filters.preset;
        }

        if (filters.preset === 'This Month' || filters.preset === 'Last Month') {
            return dayjs(filterParams.dateFrom).format('MMM-YY');
        }
        if (filters.preset === 'This Week') return 'This Week';
        if (filterParams.dateFrom && filterParams.dateTo) {
            return `${dayjs(filterParams.dateFrom).format('MMM D')} - ${dayjs(filterParams.dateTo).format('MMM D, YY')}`;
        }
        if (filterParams.dateFrom) return `Since ${dayjs(filterParams.dateFrom).format('MMM D, YY')}`;
        if (filterParams.dateTo) return `Up to ${dayjs(filterParams.dateTo).format('MMM D, YY')}`;
        return filters.preset;
    }, [filterParams, filters.preset]);

    const { data: expData, isLoading: expLoading } = useGetExpensesQuery(filterParams);
    const { data: summary } = useGetSummaryQuery(filterParams);
    const { data: trendData } = useGetTrendQuery(filterParams);
    const { data: catData } = useGetByCategoryQuery(filterParams);
    const { data: categories } = useGetCategoriesQuery();

    const [createExpense] = useCreateExpenseMutation();
    const [updateExpense] = useUpdateExpenseMutation();
    const [deleteExpense] = useDeleteExpenseMutation();
    const [restoreExpense] = useRestoreExpenseMutation();
    const [bulkDelete] = useBulkDeleteExpensesMutation();
    const [uploadReceipt] = useUploadReceiptMutation();

    const handleDelete = async (id) => {
        await deleteExpense(id);
        toast((t) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                Expense deleted
                <button onClick={async () => { await restoreExpense(id); toast.dismiss(t.id); toast.success('Restored!'); }}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Undo
                </button>
            </span>
        ), { duration: 5000 });
    };

    const handleBulkDelete = async () => {
        if (!selected.length) return;
        await bulkDelete(selected);
        setSelected([]);
        toast.success(`${selected.length} expenses deleted`);
    };

    const handleReceiptUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setOcr({ loading: true, data: null });
        try {
            const fd = new FormData();
            fd.append('receipt', file);
            const res = await uploadReceipt(fd).unwrap();
            setOcr({ loading: false, data: res });
            setShowForm(true);
            if (res.extracted?.ocrAvailable) {
                toast.success('Receipt scanned! Fields auto-filled.');
            } else {
                toast('Receipt uploaded ✅ — OCR not configured, fill details manually.', { icon: '📄' });
            }
        } catch {
            setOcr({ loading: false, data: null });
            toast.error('Upload failed. Try again.');
            setShowForm(true);
        }
    };

    const toggleSelect = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(selected.length === expData?.expenses?.length ? [] : expData?.expenses?.map((e) => e._id) || []);

    return (
        <div>
            <div className="topbar">
                <div className="topbar-title">Dashboard</div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <label className="btn btn-glow" style={{ cursor: 'pointer' }}>
                        <Upload size={14} />
                        {ocr.loading ? 'Scanning...' : 'Scan Receipt'}
                        <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleReceiptUpload} />
                    </label>
                    <button className="btn btn-primary" onClick={() => { setEditExpense(null); setOcr({ loading: false, data: null }); setShowForm(!showForm); }}>
                        <Plus size={14} /> Add Expense
                    </button>
                </div>
            </div>

            <div className="page-content">
                {/* ---- EXECUTIVE FILTER BAR ---- */}
                <div className="filter-bar">
                    <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 8 }} />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        {/* Preset buttons */}
                        <button className={`btn btn-sm ${filters.preset === 'This Week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilters({ ...filters, preset: 'This Week' })}>This Week</button>
                        <button className={`btn btn-sm ${filters.preset === 'This Month' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilters({ ...filters, preset: 'This Month' })}>This Month</button>
                        <button className={`btn btn-sm ${filters.preset === 'Last Month' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilters({ ...filters, preset: 'Last Month' })}>Last Month</button>

                        {/* Month Selector Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <select
                                className={`btn btn-sm ${RECENT_MONTHS.some(m => m.label === filters.preset) ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ appearance: 'none', paddingRight: '24px', cursor: 'pointer', outline: 'none', background: RECENT_MONTHS.some(m => m.label === filters.preset) ? 'rgba(255,255,255,0.05)' : 'transparent', border: RECENT_MONTHS.some(m => m.label === filters.preset) ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent', boxShadow: RECENT_MONTHS.some(m => m.label === filters.preset) ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)' : 'none', color: RECENT_MONTHS.some(m => m.label === filters.preset) ? '#fff' : 'var(--text-secondary)' }}
                                value={RECENT_MONTHS.some(m => m.label === filters.preset) ? filters.preset : 'History'}
                                onChange={(e) => {
                                    const selected = RECENT_MONTHS.find(m => m.label === e.target.value);
                                    if (selected) {
                                        setFilters({ ...filters, preset: selected.label, dateFrom: selected.dateFrom, dateTo: selected.dateTo });
                                    }
                                }}
                            >
                                <option value="History" disabled>History</option>
                                {RECENT_MONTHS.map(m => (
                                    <option key={m.label} value={m.label} style={{ background: '#0a0a0f', color: '#fff' }}>{m.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: RECENT_MONTHS.some(m => m.label === filters.preset) ? '#fff' : 'var(--text-secondary)' }} />
                        </div>

                        <button className={`btn btn-sm ${filters.preset === 'Custom' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilters({ ...filters, preset: 'Custom' })}>Custom</button>
                    </div>

                    <select className="form-select" style={{ width: 180 }}
                        value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                        <option value="">All Categories</option>
                        {categories?.categories?.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ preset: 'This Month', dateFrom: '', dateTo: '', category: '' })}>
                        <RotateCcw size={14} /> Reset
                    </button>
                </div>
                {filters.preset === 'Custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                        <input type="date" className="form-input" style={{ width: 140 }}
                            value={pendingDates.dateFrom} onChange={(e) => setPendingDates((p) => ({ ...p, dateFrom: e.target.value }))} />
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
                        <input type="date" className="form-input" style={{ width: 140 }}
                            value={pendingDates.dateTo} onChange={(e) => setPendingDates((p) => ({ ...p, dateTo: e.target.value }))} />
                        <button className="btn btn-primary btn-sm" onClick={() => {
                            if (pendingDates.dateFrom || pendingDates.dateTo)
                                setFilters((f) => ({ ...f, dateFrom: pendingDates.dateFrom, dateTo: pendingDates.dateTo }));
                        }}>Apply</button>
                    </div>
                )}

                {/* ---- EXECUTIVE HERO SUMMARY ---- */}
                <div className="hero-summary">
                    <div className="hero-total">
                        <div className="label">Total Spend ({displayDateRange.toUpperCase()})</div>
                        <div className="value">
                            <span>₹</span>{summary?.total ? summary.total.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                        </div>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-block">
                            <div className="label">Transactions</div>
                            <div className="value">{summary?.count || 0}</div>
                        </div>
                        <div className="stat-block">
                            <div className="label">Top Category</div>
                            <div className="value" style={{ color: summary?.topCategory?.color || '#a1a1aa' }}>
                                {summary?.topCategory?.icon || '—'} {summary?.topCategory?.name || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---- ADD / EDIT FORM ---- */}
                {showForm && (
                    <ExpenseForm
                        categories={categories?.categories || []} editData={editExpense} ocrData={ocr.data}
                        onClose={() => { setShowForm(false); setEditExpense(null); }}
                        onSave={async (data) => {
                            try {
                                if (editExpense) {
                                    await updateExpense({ id: editExpense._id, ...data }).unwrap();
                                    toast.success('Updated!');
                                } else {
                                    await createExpense(data).unwrap();
                                    toast.success('Expense added!');

                                    // Auto-adjust filter if saved date is outside current view
                                    if (data.date) {
                                        const expDay = dayjs(data.date);
                                        const { dateFrom, dateTo } = filterParams;
                                        const isOutside = dateFrom && dateTo &&
                                            (expDay.isBefore(dayjs(dateFrom)) || expDay.isAfter(dayjs(dateTo)));
                                        if (isOutside) {
                                            const monthStart = expDay.startOf('month').format('YYYY-MM-DD');
                                            const monthEnd = expDay.endOf('month').format('YYYY-MM-DD');
                                            setFilters({ preset: 'Custom', dateFrom: monthStart, dateTo: monthEnd, category: '' });
                                            toast(`📅 Filter switched to ${expDay.format('MMMM YYYY')} to show new expense`, { icon: '📅' });
                                        }
                                    }
                                }
                                setShowForm(false); setEditExpense(null); setOcr({ loading: false, data: null });
                            } catch (err) { toast.error(err.data?.message || 'Failed to save'); }
                        }}

                    />
                )}

                {/* ---- EXPENSE TABLE ---- */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Expense History</h3>
                        {selected.length > 0 && (
                            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                                <Trash2 size={13} /> Delete {selected.length} selected
                            </button>
                        )}
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" onChange={toggleAll} checked={selected.length === expData?.expenses?.length && expData?.expenses?.length > 0} /></th>
                                    <th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Description</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expLoading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>}
                                {!expLoading && !expData?.expenses?.length && (
                                    <tr><td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-icon">💸</div>
                                            <div className="empty-title">No expenses yet</div>
                                            <p>Add your first expense or scan a receipt</p>
                                        </div>
                                    </td></tr>
                                )}
                                {expData?.expenses?.map((e) => (
                                    <tr key={e._id}>
                                        <td><input type="checkbox" checked={selected.includes(e._id)} onChange={() => toggleSelect(e._id)} /></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{dayjs(e.date).format('DD MMM YYYY')}</td>
                                        <td style={{ fontWeight: 600 }}>{e.title}</td>
                                        <td>
                                            <span className="badge" style={{ background: `${e.category?.color}20`, color: e.category?.color }}>
                                                {e.category?.icon} {e.category?.name}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                                        <td style={{ color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditExpense(e); setShowForm(true); }}><Edit2 size={14} /></button>
                                                <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(e._id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ---- TREND CHART (full width) ---- */}
                <div className="chart-card" style={{ marginBottom: 32 }}>
                    <h3>Spending Velocity</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trendData?.trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#52525b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }} tickFormatter={(d) => dayjs(d).format('DD MMM')} />
                            <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ display: 'none' }} wrapperClassName="glass-tooltip" formatter={(v) => [`₹${v}`, 'Amount']} labelStyle={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }} />
                            <Line type="monotone" dataKey="total" stroke="url(#colorUv)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#818cf8', stroke: '#050508', strokeWidth: 2 }} />
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* ---- PIE + BAR CHARTS ---- */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3>Distribution</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={catData?.byCategory || []} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} stroke="rgba(255,255,255,0.05)" strokeWidth={2}>
                                    {(catData?.byCategory || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ display: 'none' }} wrapperClassName="glass-tooltip" formatter={(v) => [`₹${v}`, 'Amount']} itemStyle={{ fontWeight: 600 }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                        <h3>Category Topology</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={catData?.byCategory || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#52525b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ display: 'none' }} wrapperClassName="glass-tooltip" formatter={(v) => [`₹${v}`, 'Amount']} labelStyle={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }} />
                                <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={32}>
                                    {(catData?.byCategory || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div >
    );
}

// ---- Inline Expense Form Component ----
function ExpenseForm({ categories, editData, ocrData, onClose, onSave }) {
    const ocr = ocrData?.extracted || {};
    const [form, setForm] = useState({
        date: editData?.date ? dayjs(editData.date).format('YYYY-MM-DD') : ocr.date || dayjs().format('YYYY-MM-DD'),
        title: editData?.title || ocr.title || '',
        amount: editData?.amount || ocr.amount || '',
        category: editData?.category?._id || ocr.categoryId || '',
        description: editData?.description || ocr.description || '',
        receiptUrl: editData?.receiptUrl || ocrData?.receiptUrl || '',
        receiptPublicId: editData?.receiptPublicId || ocrData?.receiptPublicId || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category) return toast.error('Select a category');
        setSaving(true);
        await onSave({ ...form, amount: parseFloat(form.amount), ocrExtracted: !!ocrData?.receiptUrl });
        setSaving(false);
    };

    return (
        <div className="card fade-in" style={{ marginBottom: 24, border: '1px solid var(--accent)', boxShadow: 'var(--shadow-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                    {editData ? 'Edit Expense' : 'New Expense'}
                    {ocrData?.receiptUrl && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 99 }}>OCR Auto-filled</span>}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input className="form-input" type="number" placeholder="0.00" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Title</label>
                    <input className="form-input" placeholder="Coffee, Groceries..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                            <option value="">Select category</option>
                            {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input className="form-input" placeholder="Optional note..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                </div>
                {form.receiptUrl && (() => {
                    const isPdf = form.receiptUrl.toLowerCase().includes('.pdf') || form.receiptUrl.toLowerCase().includes('/raw/');
                    // Cloudinary can serve a JPG thumbnail of a PDF by swapping /raw/upload → /image/upload and appending .jpg
                    const thumbUrl = isPdf
                        ? form.receiptUrl.replace('/raw/upload/', '/image/upload/').replace(/\.pdf$/i, '.jpg')
                        : form.receiptUrl;
                    return (
                        <div style={{ marginBottom: 16 }}>
                            <label className="form-label">Receipt</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {isPdf ? (
                                    <div style={{ width: 80, height: 80, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 28 }}>📄</span>
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>PDF</span>
                                    </div>
                                ) : (
                                    <img src={thumbUrl} alt="Receipt" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                )}
                                <a href={form.receiptUrl} target="_blank" rel="noreferrer"
                                    style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                                    {isPdf ? '📎 View PDF' : '🔍 View full image'}
                                </a>
                            </div>
                        </div>
                    );
                })()}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editData ? 'Update' : 'Add Expense'}</button>
                </div>
            </form>
        </div>
    );
}
