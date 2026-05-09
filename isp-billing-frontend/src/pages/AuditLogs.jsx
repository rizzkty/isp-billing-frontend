import { useState, useEffect } from 'react';
import api from '../api';
import ExportButton from '../components/ExportButton';
import { Shield, Trash2, Loader2, Filter, Clock, User, Globe, Search, AlertTriangle } from 'lucide-react';

const actionConfig = {
    LOGIN:              { label: 'Login',            color: 'bg-green-100 text-green-700' },
    LOGOUT:             { label: 'Logout',           color: 'bg-gray-100 text-gray-600' },
    CREATE_CUSTOMER:    { label: 'Tambah Pelanggan', color: 'bg-blue-100 text-blue-700' },
    UPDATE_CUSTOMER:    { label: 'Edit Pelanggan',   color: 'bg-blue-100 text-blue-700' },
    DELETE_CUSTOMER:    { label: 'Hapus Pelanggan',  color: 'bg-red-100 text-red-700' },
    GENERATE_INVOICE:   { label: 'Generate Tagihan', color: 'bg-purple-100 text-purple-700' },
    PAYMENT_VERIFIED:   { label: 'Verifikasi Bayar', color: 'bg-green-100 text-green-700' },
    CREATE_USER:        { label: 'Buat Akun',        color: 'bg-blue-100 text-blue-700' },
    UPDATE_TICKET:      { label: 'Update Tiket',     color: 'bg-yellow-100 text-yellow-700' },
    SEND_NOTIFICATION:  { label: 'Kirim Notifikasi', color: 'bg-indigo-100 text-indigo-700' },
    VIEW_REPORT:        { label: 'Lihat Laporan',    color: 'bg-gray-100 text-gray-600' },
    AUTO_ISOLIR:        { label: 'Auto Isolir',      color: 'bg-red-100 text-red-700' },
};

const getActionStyle = (action) => {
    return actionConfig[action]?.color || (
        action.includes('CREATE') ? 'bg-green-100 text-green-700' :
        action.includes('DELETE') || action.includes('ISOLIR') ? 'bg-red-100 text-red-700' :
        action.includes('UPDATE') ? 'bg-yellow-100 text-yellow-700' :
        'bg-blue-100 text-blue-700'
    );
};

const getActionLabel = (action) => actionConfig[action]?.label || action;

const AuditLogs = () => {
    const [logs, setLogs]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [searchQuery, setSearch]  = useState('');
    const [filterAction, setFilter] = useState('all');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterAction !== 'all') params.action = filterAction;
            const res = await api.get('/audit-logs', { params });
            setLogs(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [filterAction]);

    const handleClearAll = async () => {
        if (!window.confirm('PERHATIAN: Ini akan menghapus SEMUA log audit. Lanjutkan?')) return;
        try {
            await api.delete('/audit-logs');
            fetchLogs();
        } catch { alert('Gagal menghapus log'); }
    };

    const filtered = searchQuery
        ? logs.filter(l =>
            l.detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.action?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : logs;

    const uniqueActions = [...new Set(logs.map(l => l.action))];

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-gray-700" />
                        Audit Logs
                    </h1>
                    <p className="text-gray-500 mt-1">Rekam jejak semua aktivitas penting di sistem. Hanya Pemilik yang bisa melihat.</p>
                </div>
                <div className="flex gap-3">
                    <ExportButton
                        data={filtered}
                        filename="audit-logs"
                        columns={[
                            { header: 'Waktu', accessor: 'created_at' },
                            { header: 'Pengguna', key: 'user', accessor: 'user.name' },
                            { header: 'Role', key: 'role', accessor: 'user.role' },
                            { header: 'Aksi', accessor: 'action' },
                            { header: 'Detail', accessor: 'detail' },
                            { header: 'IP Address', accessor: 'ip_address' },
                        ]}
                    />
                    <button onClick={handleClearAll}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all text-sm">
                        <Trash2 className="w-4 h-4" /> Hapus Semua Log
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchQuery} onChange={e => setSearch(e.target.value)}
                        placeholder="Cari aktivitas, user..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                </div>
                <select value={filterAction} onChange={e => setFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                    <option value="all">Semua Aksi</option>
                    {uniqueActions.map(a => <option key={a} value={a}>{getActionLabel(a)}</option>)}
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl"><Clock className="w-5 h-5 text-blue-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Log</p>
                        <p className="text-xl font-black text-gray-800">{logs.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 rounded-xl"><User className="w-5 h-5 text-green-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">User Aktif</p>
                        <p className="text-xl font-black text-gray-800">{new Set(logs.map(l => l.user_id)).size}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Aksi Kritis</p>
                        <p className="text-xl font-black text-gray-800">{logs.filter(l => l.action.includes('DELETE') || l.action.includes('ISOLIR')).length}</p>
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-900 text-white">
                        <tr>
                            {['Waktu', 'Pengguna', 'Aksi', 'Detail Aktivitas', 'IP Address'].map(h => (
                                <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-16 text-gray-400 italic">Tidak ada log ditemukan.</td></tr>
                        ) : filtered.map(log => (
                            <tr key={log.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-[10px]">
                                            {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{log.user?.name || 'System'}</p>
                                            <p className="text-[10px] text-gray-400">{log.user?.role || 'auto'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${getActionStyle(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.detail}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{log.ip_address || '—'}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;