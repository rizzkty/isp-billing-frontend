import { useState, useEffect } from 'react';
import api from '../api';
import { Bell, Send, Trash2, Loader2, Plus, X, Users, MessageSquare } from 'lucide-react';

const Notifications = () => {
    const [notifs, setNotifs]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm]           = useState({ title: '', message: '', type: 'broadcast' });
    const [sending, setSending]     = useState(false);

    const fetchNotifs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifs(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifs(); }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        try {
            setSending(true);
            const res = await api.post('/notifications', form);
            alert(res.data.message);
            setShowModal(false);
            setForm({ title: '', message: '', type: 'broadcast' });
            fetchNotifs();
        } catch (err) { alert(err.response?.data?.message || 'Gagal mengirim notifikasi'); }
        finally { setSending(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus log notifikasi ini?')) return;
        await api.delete(`/notifications/${id}`);
        fetchNotifs();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Notifikasi & Broadcast</h1>
                    <p className="text-gray-500 mt-1">Kirim pengumuman dan pemberitahuan ke pelanggan.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                    <Send className="w-4 h-4" /> Kirim Notifikasi
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><MessageSquare className="w-5 h-5 text-blue-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Notifikasi Terkirim</p>
                        <p className="text-2xl font-black text-gray-800">{notifs.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 border border-green-100"><Users className="w-5 h-5 text-green-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Penerima (Kumulatif)</p>
                        <p className="text-2xl font-black text-gray-800">{notifs.reduce((a, n) => a + (n.recipient_count || 0), 0)}</p>
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h2 className="font-black text-gray-800">Log Notifikasi Terkirim</h2>
                </div>
                {loading ? (
                    <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : notifs.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 italic">Belum ada notifikasi yang dikirim.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifs.map(n => (
                            <div key={n.id} className="p-5 hover:bg-blue-50/20 transition-colors flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-0.5 p-2 rounded-xl ${n.type === 'broadcast' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {n.type === 'broadcast' ? <Users className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{n.title}</p>
                                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.type === 'broadcast' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {n.type === 'broadcast' ? 'Broadcast' : 'Personal'}
                                            </span>
                                            <span className="text-xs text-gray-400">{n.recipient_count} penerima</span>
                                            <span className="text-xs text-gray-400">• Oleh: {n.sender?.name || 'System'}</span>
                                            <span className="text-xs text-gray-400">• {new Date(n.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(n.id)} className="flex-shrink-0 p-2 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="font-black text-lg text-gray-800">Kirim Notifikasi</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSend} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Judul</label>
                                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Pesan</label>
                                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                                    rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipe</label>
                                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="broadcast">Broadcast (Semua Pelanggan Aktif)</option>
                                    <option value="personal">Personal</option>
                                </select>
                            </div>
                            <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl border border-blue-100">
                                💡 Notifikasi akan disimpan sebagai log. Integrasi WhatsApp akan aktif di tahap berikutnya.
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold">Batal</button>
                                <button type="submit" disabled={sending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Kirim Sekarang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
