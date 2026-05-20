import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Users, AlertCircle, Activity, Plus, FileText, Clock, CheckCircle, TrendingUp, DollarSign, Package as PackageIcon, Loader2, ExternalLink, ShieldAlert, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const Dashboard = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [portalLinkLoading, setPortalLinkLoading] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashRes, custRes] = await Promise.all([
                api.get('/dashboard'),
                api.get('/customers'),
            ]);
            setData(dashRes.data);
            setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
        } catch (err) {
            console.error('Gagal mengambil data dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleOpenPortal = async (cust) => {
        setPortalLinkLoading(cust.id);
        try {
            const res = await api.post(`/customers/${cust.id}/portal-link`);
            window.open(res.data.portal_url, '_blank', 'noopener,noreferrer');
            addToast(`🔗 Portal ${cust.name} berhasil dibuka! (berlaku 30 menit)`, 'success');
        } catch (err) {
            addToast('❌ Gagal generate link portal. Coba lagi.', 'error');
        } finally {
            setPortalLinkLoading(null);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={true} text="Menghitung statistik bisnis Anda..." />;
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-sm">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
                    <p className="text-gray-500 mb-6">Gagal memuat data dashboard. Silakan periksa koneksi Anda dan coba lagi.</p>
                    <button
                        onClick={fetchDashboardData}
                        className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    const { stats = {}, chartData = [], recent_activities = [] } = data;

    // Pisah pelanggan berdasarkan status
    const isolated = customers.filter(c => c.status === 'terisolir');
    const active = customers.filter(c => c.status === 'aktif');

    const getPortalCardStyle = (cust) => {
        if (cust.status === 'terisolir') {
            return {
                card: 'border-red-200 bg-red-50 hover:shadow-red-100',
                badge: 'bg-red-500 text-white',
                badgeText: 'TERISOLIR',
                btn: 'bg-red-500 hover:bg-red-600 text-white',
                avatar: 'bg-red-100 text-red-600',
                icon: <ShieldAlert className="w-3 h-3" />,
                pulse: true,
            };
        }
        return {
            card: 'border-gray-100 bg-white hover:shadow-indigo-50',
            badge: 'bg-green-100 text-green-700',
            badgeText: 'AKTIF',
            btn: 'bg-indigo-500 hover:bg-indigo-600 text-white',
            avatar: 'bg-indigo-50 text-indigo-600',
            icon: <Zap className="w-3 h-3" />,
            pulse: false,
        };
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800">Dashboard Utama</h1>
                        <p className="text-gray-500 mt-1">Selamat datang kembali, <span className="font-bold text-blue-600 capitalize">{user?.username || 'Admin'}</span>!</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Sistem</p>
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online &amp; Terhubung
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                {(user?.role === 'admin' || user?.role === 'pemilik') && (
                    <div className="flex flex-wrap gap-4 mb-8">
                        <Link to="/customers" className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 font-bold transition-all hover:-translate-y-0.5">
                            <Plus className="w-4 h-4 mr-2" /> Tambah Pelanggan
                        </Link>
                        <Link to="/billing" className="flex items-center px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md font-bold transition-all">
                            <FileText className="w-4 h-4 mr-2 text-green-500" /> Kelola Tagihan
                        </Link>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pelanggan</h3>
                            <p className="text-3xl font-black text-gray-800">{stats.total_customers}</p>
                            <span className="text-[10px] text-green-500 font-bold flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> {stats.active_customers} Aktif
                            </span>
                        </div>
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Omzet Bulan Ini</h3>
                            <p className="text-2xl font-black text-gray-800">Rp {stats.revenue_this_month.toLocaleString('id-ID')}</p>
                            <span className="text-[10px] text-blue-500 font-bold flex items-center mt-1 uppercase">Bulan Berjalan</span>
                        </div>
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Piutang (Belum Bayar)</h3>
                            <p className="text-2xl font-black text-gray-800">Rp {stats.pending_payments.toLocaleString('id-ID')}</p>
                            <span className="text-[10px] text-red-500 font-bold flex items-center mt-1 uppercase">Perlu Ditagih</span>
                        </div>
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Menu Paket</h3>
                            <p className="text-3xl font-black text-gray-800">{stats.total_packages}</p>
                            <span className="text-[10px] text-purple-500 font-bold flex items-center mt-1 uppercase">Layanan Aktif</span>
                        </div>
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <PackageIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* ======================================================= */}
                {/* PORTAL PELANGGAN — AKSES CEPAT                           */}
                {/* ======================================================= */}
                {(user?.role === 'admin' || user?.role === 'pemilik') && customers.length > 0 && (
                    <div className="mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                    <span className="p-1.5 bg-indigo-50 rounded-lg">
                                        <ExternalLink className="w-4 h-4 text-indigo-600" />
                                    </span>
                                    Akses Cepat Portal Pelanggan
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5 ml-9">Klik untuk masuk ke portal sebagai pelanggan — link berlaku 30 menit</p>
                            </div>
                            {isolated.length > 0 && (
                                <span className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full animate-pulse">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    {isolated.length} Terisolir
                                </span>
                            )}
                        </div>

                        {/* Terisolir — urgent */}
                        {isolated.length > 0 && (
                            <div className="mb-5">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block"></span>
                                    Perlu Penanganan Segera
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                                    {isolated.map(cust => {
                                        const s = getPortalCardStyle(cust);
                                        return (
                                            <div key={cust.id} className={`relative rounded-2xl border p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg transition-all cursor-default ${s.card}`}>
                                                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-white" />
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base ${s.avatar}`}>
                                                    {cust.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate leading-tight">{cust.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono truncate">{cust.customer_id}</p>
                                                    <span className={`mt-1 inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${s.badge}`}>
                                                        {s.icon} {s.badgeText}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenPortal(cust)}
                                                    disabled={portalLinkLoading === cust.id}
                                                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${s.btn}`}
                                                >
                                                    {portalLinkLoading === cust.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <ExternalLink className="w-3.5 h-3.5" />
                                                    }
                                                    Buka Portal
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Aktif */}
                        {active.length > 0 && (
                            <div>
                                {isolated.length > 0 && <hr className="my-4 border-gray-100" />}
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3 text-green-500" /> Pelanggan Aktif
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                                    {active.map(cust => {
                                        const s = getPortalCardStyle(cust);
                                        return (
                                            <div key={cust.id} className={`relative rounded-2xl border p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg transition-all cursor-default ${s.card}`}>
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base ${s.avatar}`}>
                                                    {cust.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate leading-tight">{cust.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono truncate">{cust.customer_id}</p>
                                                    <span className={`mt-1 inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${s.badge}`}>
                                                        {s.icon} {s.badgeText}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenPortal(cust)}
                                                    disabled={portalLinkLoading === cust.id}
                                                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${s.btn}`}
                                                >
                                                    {portalLinkLoading === cust.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <ExternalLink className="w-3.5 h-3.5" />
                                                    }
                                                    Buka Portal
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Charts + Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-xl text-gray-800">Tren Pendapatan</h3>
                            <div className="text-xs font-bold text-gray-400">12 Bulan Terakhir</div>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 mb-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Lunas</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Belum Bayar</span>
                            </div>
                        </div>

                        {(() => {
                            const CHART_H = 220;
                            const normalizedData = chartData.map(m => ({
                                ...m,
                                paid: m.paid ?? m.revenue ?? 0,
                                unpaid: m.unpaid ?? 0,
                            }));
                            const maxTotal = Math.max(...normalizedData.map(m => m.paid + m.unpaid), 1);

                            return (
                                <div className="relative" style={{ height: CHART_H + 36 }}>
                                    <div className="flex items-end justify-between gap-1 px-1" style={{ height: CHART_H }}>
                                        {normalizedData.map((month, idx) => {
                                            const paidPx   = (month.paid   / maxTotal) * CHART_H;
                                            const unpaidPx = (month.unpaid / maxTotal) * CHART_H;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: CHART_H }}>
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-20 pointer-events-none whitespace-nowrap">
                                                        <div className="font-bold border-b border-gray-700 pb-0.5 mb-0.5">{month.name}</div>
                                                        <div className="text-green-400">Lunas: Rp {month.paid.toLocaleString('id-ID')}</div>
                                                        <div className="text-yellow-400">Sisa: Rp {month.unpaid.toLocaleString('id-ID')}</div>
                                                    </div>
                                                    <div style={{ height: unpaidPx }} className="w-full max-w-[24px] bg-yellow-400 rounded-t-sm flex-shrink-0 transition-all duration-500"></div>
                                                    <div style={{ height: paidPx }} className="w-full max-w-[24px] bg-green-500 rounded-t-sm flex-shrink-0 transition-all duration-500"></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between gap-1 px-1 mt-2">
                                        {normalizedData.map((month, idx) => (
                                            <div key={idx} className="flex-1 flex justify-center">
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{month.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-black text-xl text-gray-800 mb-6">Aktivitas Terakhir</h3>
                        <div className="space-y-6">
                            {recent_activities.length === 0 ? (
                                <div className="text-center py-10">
                                    <Activity className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm italic">Belum ada aktivitas baru.</p>
                                </div>
                            ) : (
                                recent_activities.map((act, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className={`p-2 rounded-xl shrink-0 ${act.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                            {act.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-gray-900 truncate">{act.customer?.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {act.status === 'paid' ? 'Pelunasan tagihan' : 'Tagihan baru diterbitkan'}
                                            </p>
                                            <p className="text-xs font-black text-gray-800 mt-1">Rp {Number(act.amount).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link to="/billing" className="block w-full text-center mt-8 text-sm font-bold text-blue-600 hover:underline">
                            Lihat Semua Riwayat
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;