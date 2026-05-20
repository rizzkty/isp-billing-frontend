import { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, Trash2, Edit2, X, Check, Loader2, Shield, Wrench, Crown } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const roleConfig = {
    pemilik: { label: 'Pemilik',  color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Crown },
    admin:   { label: 'Admin',    color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Shield },
    teknisi: { label: 'Teknisi',  color: 'bg-green-100 text-green-700 border-green-200',    icon: Wrench },
};

const emptyForm = { name: '', username: '', password: '', role: 'teknisi' };

const UserPage = () => {
    const [users, setUsers]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm]           = useState(emptyForm);
    const [saving, setSaving]       = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); };
    const openEdit   = (u)  => { setEditTarget(u);  setForm({ name: u.name, username: u.username, password: '', role: u.role }); setShowModal(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editTarget) {
                await api.put(`/users/${editTarget.id}`, form);
            } else {
                await api.post('/users', form);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan data');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Hapus akun "${name}"?`)) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch { alert('Gagal menghapus akun'); }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Manajemen Staff</h1>
                    <p className="text-gray-500 mt-1">Kelola akun Admin dan Teknisi sistem.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Tambah Staff
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {Object.entries(roleConfig).map(([role, cfg]) => {
                    const Icon = cfg.icon;
                    const count = users.filter(u => u.role === role).length;
                    return (
                        <div key={role} className={`flex items-center gap-4 p-5 rounded-2xl border bg-white shadow-sm`}>
                            <div className={`p-3 rounded-xl border ${cfg.color}`}><Icon className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{cfg.label}</p>
                                <p className="text-2xl font-black text-gray-800">{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Nama', 'Username', 'Role', 'Bergabung', 'Aksi'].map(h => (
                                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-12">
                                <LoadingSpinner text="Memuat daftar staff..." />
                            </td></tr>
                        ) : users.map(u => {
                            const cfg = roleConfig[u.role] || roleConfig.teknisi;
                            const Icon = cfg.icon;
                            return (
                                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {(u.name?.charAt(0) || '?').toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-800">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">@{u.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                                            <Icon className="w-3 h-3" /> {cfg.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(u)}
                                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(u.id, u.name)}
                                                className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => (saving ? undefined : setShowModal(false))}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
                        {saving && <LoadingSpinner overlay={true} text="Menyimpan akun staff..." />}
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="font-black text-lg text-gray-800">
                                {editTarget ? 'Edit Akun Staff' : 'Tambah Staff Baru'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required disabled={!!editTarget} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Password {editTarget && <span className="font-normal text-gray-400">(kosongkan jika tidak ingin diubah)</span>}
                                </label>
                                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required={!editTarget} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="teknisi">Teknisi</option>
                                    <option value="admin">Admin</option>
                                    <option value="pemilik">Pemilik</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition">Batal</button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editTarget ? 'Simpan Perubahan' : 'Buat Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPage;