import { useAuth } from '../context/AuthContext';
import { Users, AlertCircle, WifiOff, Activity, Plus, FileText, Send, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                        <p className="text-gray-500 mt-1">Selamat datang, <span className="font-bold text-blue-600 capitalize">{user?.role || 'Admin'}</span>! Berikut adalah ringkasan sistem Anda hari ini.</p>
                    </div>
                </div>

                {/* Quick Actions (Hanya untuk Admin/Pemilik) */}
                {(user?.role === 'admin' || user?.role === 'pemilik') && (
                    <div className="flex flex-wrap gap-4 mb-8">
                        <Link to="/customers" className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-bold transition">
                            <Plus className="w-4 h-4 mr-2" /> Pelanggan Baru
                        </Link>
                        <Link to="/ticketing" className="flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 font-bold transition">
                            <AlertCircle className="w-4 h-4 mr-2 text-red-500" /> Buat Tiket
                        </Link>
                        <Link to="/billing" className="flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 font-bold transition">
                            <FileText className="w-4 h-4 mr-2 text-green-500" /> Cek Tagihan
                        </Link>
                        <Link to="/notifications" className="flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 font-bold transition">
                            <Send className="w-4 h-4 mr-2 text-blue-500" /> Broadcast Info
                        </Link>
                    </div>
                )}

                {/* Statistik Utama */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                        <div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Pelanggan Aktif</h3>
                            <p className="text-3xl font-bold text-gray-800">1,245</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                        <div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Terisolir</h3>
                            <p className="text-3xl font-bold text-gray-800">32</p>
                        </div>
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                        <div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Offline / LOS</h3>
                            <p className="text-3xl font-bold text-gray-800">7</p>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg"><WifiOff className="w-6 h-6" /></div>
                    </div>
                    
                    {/* Network Health Widget */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-sm border border-gray-700 text-white flex flex-col justify-between transition hover:shadow-md">
                        <div className="flex justify-between items-start">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Status NOC</h3>
                            <Activity className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-bold text-lg">Gateway Normal</span>
                            </div>
                            <p className="text-sm text-gray-400">Trafik Aktif: <span className="text-blue-300 font-mono font-bold">450 Mbps</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Tabel Antrean Tiket */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Antrean Tiket Terbuka</h3>
                            <Link to={user?.role === 'teknisi' ? '/inbox' : '/ticketing'} className="text-sm text-blue-600 font-bold hover:underline">
                                Lihat Semua
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Detail Keluhan</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Pelanggan</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">LOS Merah di Modem</p>
                                            <p className="text-xs text-gray-500 mt-1">Kabel putus area Jl. Sumatera</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">Siti Aminah</td>
                                        <td className="px-6 py-4"><span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold">Open</span></td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">Ping Tinggi Game Online</p>
                                            <p className="text-xs text-gray-500 mt-1">Latency spike saat malam</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">Budi Santoso</td>
                                        <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full text-xs font-bold">In Progress</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Timeline Aktivitas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800">Aktivitas Terbaru</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Item 1 */}
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center z-10 relative border-2 border-white ring-2 ring-green-50">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="absolute top-10 left-1/2 -ml-px w-0.5 h-[120%] bg-gray-200"></div>
                                    </div>
                                    <div className="pb-2">
                                        <p className="text-sm font-bold text-gray-800">Pembayaran Diterima</p>
                                        <p className="text-sm text-gray-600 mt-0.5">Budi Santoso melunasi tagihan Rp 150.000 via Transfer BCA.</p>
                                        <p className="text-xs text-gray-400 mt-1.5 flex items-center"><Clock className="w-3 h-3 mr-1" /> 10 Menit lalu</p>
                                    </div>
                                </div>
                                
                                {/* Item 2 */}
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center z-10 relative border-2 border-white ring-2 ring-red-50">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="absolute top-10 left-1/2 -ml-px w-0.5 h-[120%] bg-gray-200"></div>
                                    </div>
                                    <div className="pb-2">
                                        <p className="text-sm font-bold text-gray-800">Alarm NOC: ODP LOS</p>
                                        <p className="text-sm text-gray-600 mt-0.5">Terdeteksi redaman kritis di ODP Jl. Sumatera (Pelanggan Siti Aminah).</p>
                                        <p className="text-xs text-gray-400 mt-1.5 flex items-center"><Clock className="w-3 h-3 mr-1" /> 1 Jam lalu</p>
                                    </div>
                                </div>

                                {/* Item 3 */}
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center z-10 relative border-2 border-white ring-2 ring-blue-50">
                                            <Send className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Broadcast Terkirim</p>
                                        <p className="text-sm text-gray-600 mt-0.5">Admin mengirim Notifikasi Gangguan ke 150 pelanggan Area Selatan.</p>
                                        <p className="text-xs text-gray-400 mt-1.5 flex items-center"><Clock className="w-3 h-3 mr-1" /> 3 Jam lalu</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;