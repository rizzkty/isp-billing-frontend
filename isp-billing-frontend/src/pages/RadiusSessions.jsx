import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Activity, Download, Upload, Clock, Power, ShieldAlert, Wifi } from 'lucide-react';

const RadiusSessions = () => {
    const [data, setData] = useState({ total_users: 0, total_traffic: 0, sessions: [] });
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await api.get('/radius/sessions');
                if (res.data.success) {
                    setData(res.data.data);
                    setIsDemo(res.data.is_demo);
                }
                setError(null);
            } catch (err) {
                console.error("Gagal mengambil data radius:", err);
                setError("Gagal menghubungi server RADIUS.");
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
        const interval = setInterval(fetchSessions, 5000); // Polling tiap 5 detik
        return () => clearInterval(interval);
    }, []);

    const handleDisconnect = (username) => {
        // Simulasi Disconnect (CoA)
        alert(`Request Disconnect (CoA) dikirim untuk user: ${username}`);
    };

    if (loading && data.sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Activity className="w-12 h-12 animate-spin mb-4 text-purple-500" />
                <p className="font-semibold text-lg animate-pulse">Menghubungkan ke Server RADIUS...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn bg-gray-50 min-h-screen space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <Users className="w-8 h-8 mr-3 text-purple-600" />
                        Active RADIUS Sessions
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Pemantauan pelanggan online dan penggunaan kuota secara real-time</p>
                </div>
            </div>

            {isDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm flex items-center gap-2 animate-pulse">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <span>Anda sedang melihat <strong>Mode Demo</strong> karena database RADIUS belum terkonfigurasi. Konfigurasi di menu Integrasi Sistem.</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-4 bg-purple-100 rounded-full mr-4">
                        <Wifi className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-semibold">Total Pengguna Aktif</h3>
                        <p className="text-3xl font-bold text-gray-800">{data.total_users}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-4 bg-blue-100 rounded-full mr-4">
                        <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-semibold">Total Traffic Sesi (Tx+Rx)</h3>
                        <p className="text-3xl font-bold text-gray-800">{data.total_traffic} <span className="text-lg">MB</span></p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-gray-500" /> Daftar Koneksi Klien
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User / IP</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">MAC Address</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Mulai</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Uptime</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usage (DL / UL)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.sessions.map((session, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{session.username}</div>
                                        <div className="text-xs text-gray-500">{session.ip_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {session.mac_address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {session.start_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Clock className="w-3 h-3 mr-1" /> {session.uptime}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center text-blue-600"><Download className="w-3 h-3 mr-1" /> {session.download} MB</span>
                                            <span className="flex items-center text-orange-500"><Upload className="w-3 h-3 mr-1" /> {session.upload} MB</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleDisconnect(session.username)}
                                            className="text-red-600 hover:text-red-900 flex items-center justify-end w-full"
                                        >
                                            <Power className="w-4 h-4 mr-1" /> Disconnect
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data.sessions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Belum ada user yang terhubung ke jaringan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RadiusSessions;
