import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Users, AlertCircle, WifiOff, Activity, Plus, FileText, Send, Clock, CheckCircle, TrendingUp, DollarSign, Package as PackageIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard');
            setData(response.data);
        } catch (err) {
            console.error('Gagal mengambil data dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

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
                            Online & Terhubung
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
                            const CHART_H = 220; // px
                            const normalizedData = chartData.map(m => ({
                                ...m,
                                paid: m.paid ?? m.revenue ?? 0,
                                unpaid: m.unpaid ?? 0,
                            }));
                            const maxTotal = Math.max(...normalizedData.map(m => m.paid + m.unpaid), 1);

                            return (
                                <div className="relative" style={{ height: CHART_H + 36 }}>
                                    {/* Bars area */}
                                    <div className="flex items-end justify-between gap-1 px-1" style={{ height: CHART_H }}>
                                        {normalizedData.map((month, idx) => {
                                            const paidPx   = (month.paid   / maxTotal) * CHART_H;
                                            const unpaidPx = (month.unpaid / maxTotal) * CHART_H;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: CHART_H }}>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-20 pointer-events-none whitespace-nowrap">
                                                        <div className="font-bold border-b border-gray-700 pb-0.5 mb-0.5">{month.name}</div>
                                                        <div className="text-green-400">Lunas: Rp {month.paid.toLocaleString('id-ID')}</div>
                                                        <div className="text-yellow-400">Sisa: Rp {month.unpaid.toLocaleString('id-ID')}</div>
                                                    </div>
                                                    {/* Unpaid */}
                                                    <div style={{ height: unpaidPx }} className="w-full max-w-[24px] bg-yellow-400 rounded-t-sm flex-shrink-0 transition-all duration-500"></div>
                                                    {/* Paid */}
                                                    <div style={{ height: paidPx }} className="w-full max-w-[24px] bg-green-500 rounded-t-sm flex-shrink-0 transition-all duration-500"></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Labels */}
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