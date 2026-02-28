import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '../api/otherApis.js';

const EMOJI_OPTIONS = ['🍔', '🚗', '🛍️', '💊', '🎬', '💡', '📚', '✈️', '🛒', '🧴', '🏠', '📺', '🛡️', '🎁', '📦', '💻', '🏋️', '🐾', '🌐', '🎮'];

export default function CategoriesPage() {
    const { data } = useGetCategoriesQuery();
    const [createCategory] = useCreateCategoryMutation();
    const [updateCategory] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', icon: '📦', color: '#6366f1' });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateCategory({ id: editing._id, ...form }).unwrap();
                toast.success('Category updated');
                setEditing(null);
            } else {
                await createCategory(form).unwrap();
                toast.success('Category created');
            }
            setForm({ name: '', icon: '📦', color: '#6366f1' });
            setShowForm(false);
        } catch (err) {
            toast.error(err.data?.message || 'Failed');
        }
    };

    const startEdit = (cat) => {
        setEditing(cat);
        setForm({ name: cat.name, icon: cat.icon, color: cat.color });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteCategory(id).unwrap();
            toast.success('Category deleted');
        } catch (err) {
            toast.error(err.data?.message || 'Cannot delete predefined category');
        }
    };

    const predefined = data?.categories?.filter((c) => c.isDefault) || [];
    const custom = data?.categories?.filter((c) => !c.isDefault) || [];

    return (
        <div>
            <div className="topbar">
                <div className="topbar-title">Categories</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm({ name: '', icon: '📦', color: '#6366f1' }); setShowForm(!showForm); }}>
                    <Plus size={14} /> Add Category
                </button>
            </div>
            <div className="page-content">
                {showForm && (
                    <div className="card fade-in" style={{ marginBottom: 24, border: '1px solid var(--accent)', maxWidth: 480 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Edit Category' : 'New Category'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Name</label>
                                <input className="form-input" placeholder="Category name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Icon</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {EMOJI_OPTIONS.map((em) => (
                                        <button key={em} type="button" onClick={() => setForm({ ...form, icon: em })}
                                            style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${form.icon === em ? 'var(--accent)' : 'var(--border)'}`, background: form.icon === em ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)', cursor: 'pointer', fontSize: 18 }}>
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                                        style={{ width: 48, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{form.color}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                )}

                {predefined.length > 0 && (
                    <>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Predefined</h3>
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: 28 }}>
                            {predefined.map((c) => (
                                <div key={c._id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 24, width: 36, height: 36, borderRadius: 8, background: `${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {custom.length > 0 && (
                    <>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Custom</h3>
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                            {custom.map((c) => (
                                <div key={c._id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 24, width: 36, height: 36, borderRadius: 8, background: `${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{c.name}</span>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(c)}><Edit2 size={13} /></button>
                                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(c._id)}><Trash2 size={13} /></button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!predefined.length && !custom.length && (
                    <div className="empty-state">
                        <div className="empty-icon">🏷️</div>
                        <div className="empty-title">No categories yet</div>
                        <p>Run the seed script on the server to load predefined categories</p>
                    </div>
                )}
            </div>
        </div>
    );
}
