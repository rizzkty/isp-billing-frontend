import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Users, AlertCircle, WifiOff, Activity, Plus, FileText, Send, Clock, CheckCircle, TrendingUp, DollarSign, Package as PackageIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">Menghitung statistik bisnis Anda...</p>
                </div>
            </div>
        );
    }

    const { stats, chartData, recent_activities } = data;

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
                    {/* Revenue Chart (Visual Bar Sederhana) */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-black text-xl text-gray-800">Tren Pendapatan</h3>
                            <div className="text-xs font-bold text-gray-400">6 Bulan Terakhir</div>
                        </div>
                        
                        <div className="flex items-end justify-between h-48 gap-4 px-2">
                            {chartData.map((month, idx) => {
                                const maxRevenue = Math.max(...chartData.map(m => m.revenue)) || 1;
                                const height = (month.revenue / maxRevenue) * 100;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group">
                                        <div className="w-full relative flex items-end justify-center mb-2 h-full">
                                            {/* Tooltip on hover */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                Rp {month.revenue.toLocaleString('id-ID')}
                                            </div>
                                            <div 
                                                style={{ height: `${height}%` }}
                                                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${idx === chartData.length - 1 ? 'bg-blue-600' : 'bg-blue-100 group-hover:bg-blue-300'}`}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{month.name.substring(0, 3)}</span>
                                    </div>
                                );
                            })}
                        </div>
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