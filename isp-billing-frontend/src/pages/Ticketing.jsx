import { useState, useEffect } from 'react';
import api from '../api';
import { TicketIcon, Plus, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const statusConfig = {
    open:        { label: 'Open',        color: 'bg-red-100 text-red-700 border-red-200' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-700 border-green-200' },
    closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const priorityConfig = {
    low:    { label: 'Low',    color: 'text-gray-500' },
    medium: { label: 'Medium', color: 'text-blue-500' },
    high:   { label: 'High',   color: 'text-orange-500' },
    urgent: { label: 'URGENT', color: 'text-red-600 font-black' },
};

const emptyForm = { title: '', description: '', priority: 'medium', customer_id: '', assigned_to: '', status: 'open', resolution: '' };

const Ticketing = () => {
    const [tickets, setTickets]       = useState([]);
    const [customers, setCustomers]   = useState([]);
    const [users, setUsers]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [filterStatus, setFilter]   = useState('all');
    const [showModal, setShowModal]   = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm]             = useState(emptyForm);
    const [saving, setSaving]         = useState(false);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [t, c, u] = await Promise.all([api.get('/tickets'), api.get('/customers'), api.get('/users')]);
            setTickets(t.data); setCustomers(c.data); setUsers(u.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); };
    const openEdit   = (t) => {
        setEditTarget(t);
        setForm({ title: t.title, description: t.description, priority: t.priority,
            customer_id: t.customer_id || '', assigned_to: t.assigned_to || '',
            status: t.status, resolution: t.resolution || '' });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editTarget) await api.put(`/tickets/${editTarget.id}`, form);
            else await api.post('/tickets', form);
            setShowModal(false); fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan tiket'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus tiket ini?')) return;
        await api.delete(`/tickets/${id}`); fetchAll();
    };

    const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);
    const counts   = { all: tickets.length, open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Ticketing & Keluhan</h1>
                    <p className="text-gray-500 mt-1">Kelola laporan gangguan dan permintaan pelanggan.</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Buat Tiket
                </button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {[['all','Semua'],['open','Open'],['in_progress','In Progress'],['resolved','Resolved'],['closed','Closed']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === val ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        {label} <span className="ml-1 opacity-70">({counts[val] || 0})</span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Tiket','Pelanggan','Prioritas','Status','Ditugaskan','Aksi'].map(h => (
                                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-12"><LoadingSpinner text="Memuat tiket..." /></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-12 text-gray-400 italic">Tidak ada tiket.</td></tr>
                        ) : filtered.map(t => {
                            const sCfg = statusConfig[t.status] || statusConfig.open;
                            const pCfg = priorityConfig[t.priority] || priorityConfig.medium;
                            return (
                                <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-800 text-sm">{t.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{t.customer?.name || <span className="italic text-gray-400">Umum</span>}</td>
                                    <td className="px-6 py-4"><span className={`text-xs font-bold uppercase ${pCfg.color}`}>{pCfg.label}</span></td>
                                    <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${sCfg.color}`}>{sCfg.label}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{t.assigned_to?.name || <span className="italic text-gray-300">—</span>}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(t)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => (saving ? undefined : setShowModal(false))}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10">
                        {saving && <LoadingSpinner overlay={true} text="Menyimpan tiket..." />}
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h3 className="font-black text-lg text-gray-800">{editTarget ? 'Edit Tiket' : 'Buat Tiket Baru'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Keluhan</label>
                                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                                    rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Prioritas</label>
                                    <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {['open','in_progress','resolved','closed'].map(s => <option key={s} value={s}>{statusConfig[s]?.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Pelanggan</label>
                                <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">— Umum —</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ditugaskan ke</label>
                                <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">— Belum ditugaskan —</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            {['resolved','closed'].includes(form.status) && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Catatan Penyelesaian</label>
                                    <textarea value={form.resolution} onChange={e => setForm({...form, resolution: e.target.value})}
                                        rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold">Batal</button>
                                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editTarget ? 'Simpan' : 'Buat Tiket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ticketing;
