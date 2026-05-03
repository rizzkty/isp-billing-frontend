import { useState, useEffect, useRef } from 'react';
import { Activity, Server, AlertTriangle, Terminal, Wifi, X, CheckCircle, Send, Zap, Radio } from 'lucide-react';
import api from '../api';

const NetworkMonitoring = () => {
    // State untuk sistem Tab
    const [activeTab, setActiveTab] = useState('traffic');

    // State untuk data dari API
    const [nocData, setNocData] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(true); // Default asumsi demo dulu
    const [statusGateway, setStatusGateway] = useState('CONNECTING');
    
    const logEndRef = useRef(null);

    // State untuk Auto-Ticketing
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState({ title: '', desc: '', alarmType: 'general' });
    const [ticketStatus, setTicketStatus] = useState(null); // null | 'loading' | 'success' | 'error'

    // Fungsi Fetch ke Backend Laravel (credentials sudah di-handle backend)
    const fetchNocData = async () => {
        try {
            const response = await api.get('/noc/stats');
            const result = response.data;

            if (result.success) {
                setNocData(result.data);
                setIsDemoMode(result.is_demo === true);
                setStatusGateway(result.is_demo ? 'DEMO' : 'ONLINE');
            } else {
                setStatusGateway('ERROR');
            }
        } catch (error) {
            console.error("Gagal menarik data live:", error);
            setStatusGateway('OFFLINE');
        }
    };

    // Efek Polling Real-time (setiap 5 detik)
    useEffect(() => {
        fetchNocData();
        const interval = setInterval(fetchNocData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto scroll syslog ke bawah saat ada log baru
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [nocData?.logs]);

    const handleCreateTicket = (title, desc, alarmType = 'general') => {
        setTicketData({ title, desc, alarmType });
        setTicketStatus(null);
        setShowTicketModal(true);
    };

    const handleSubmitTicket = async () => {
        setTicketStatus('loading');

        // Logika prioritas otomatis berdasarkan tipe alarm
        const priorityMap = {
            los: 'urgent',
            cpu_high: 'high',
            link_down: 'high',
            general: 'medium',
        };
        const priority = priorityMap[ticketData.alarmType] || 'medium';

        try {
            await api.post('/tickets', {
                title: ticketData.title,
                description: ticketData.desc,
                priority: priority,
            });
            setTicketStatus('success');
            setTimeout(() => setShowTicketModal(false), 1500);
        } catch (error) {
            console.error(error);
            setTicketStatus('error');
        }
    };

    // Helper: format log dari MikroTik
    const formatLogs = (logs = []) => {
        return logs.map((log, i) => {
            const time = log.time || '';
            const topic = log.topics || 'system';
            const message = log.message || '';
            return (
                <div key={i} className="mb-1">
                    <span className="text-green-400">[{time}]</span>
                    <span className={`ml-2 ${topic === 'error' ? 'text-red-400' : 'text-blue-300'}`}>[{topic}]</span>
                    <span className="text-gray-300 ml-2">{message}</span>
                </div>
            );
        });
    };

    const cpuLoad = nocData?.cpu_load ?? 0;
    const uptime = nocData?.uptime ?? 'Menghubungkan...';
    const traffic = nocData?.traffic ?? 0;
    const logs = nocData?.logs ?? [{ time: '--:--:--', topics: 'system', message: 'Menghubungkan ke server...' }];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header dengan badge Demo/Live */}
            <div className="flex justify-between items-end mb-6 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Network Operations Center</h1>
                    <p className="text-gray-500 mt-1">Area Pusat Kendali Jaringan ISP (Enterprise Level)</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDemoMode ? (
                        <span className="flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300 animate-pulse">
                            <Zap className="w-3 h-3" />
                            DEMO MODE — Konfigurasi MikroTik di halaman Integrasi
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full border border-green-300">
                            <Radio className="w-3 h-3 animate-pulse" />
                            LIVE — Data Real-time MikroTik
                        </span>
                    )}
                </div>
            </div>

            {/* Menu Navigasi (Tabs) Internal NOC */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
                <button
                    onClick={() => setActiveTab('traffic')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'traffic' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    <Activity className="w-4 h-4 mr-2" /> Traffic &amp; Performa
                </button>
                <button
                    onClick={() => setActiveTab('devices')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'devices' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    <Server className="w-4 h-4 mr-2" /> Manajemen Perangkat
                </button>
                <button
                    onClick={() => setActiveTab('alarms')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'alarms' ? 'bg-white shadow text-red-600' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Alarm &amp; Insiden
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">1</span>
                </button>
            </div>

            {/* TAB 1: TRAFFIC & PERFORMA */}
            {activeTab === 'traffic' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Status Gateway */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Status Gateway (Core)</h3>
                            {statusGateway === 'ONLINE' && (
                                <p className="text-2xl font-bold text-green-600 flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></span> ONLINE
                                </p>
                            )}
                            {statusGateway === 'DEMO' && (
                                <p className="text-2xl font-bold text-amber-500 flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse mr-2"></span> DEMO
                                </p>
                            )}
                            {(statusGateway === 'OFFLINE' || statusGateway === 'ERROR' || statusGateway === 'CONNECTING') && (
                                <p className="text-2xl font-bold text-red-600 flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> {statusGateway}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 font-mono">Uptime: {uptime}</p>
                        </div>

                        {/* Total Bandwidth */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-2">
                            <h3 className="text-gray-500 text-sm font-semibold mb-2">
                                Total Bandwidth (Tx+Rx)
                                {isDemoMode && <span className="ml-2 text-amber-500 text-xs font-normal">— simulasi</span>}
                            </h3>
                            <div className="flex items-end gap-4">
                                <div className="min-w-[120px]">
                                    <p className="text-3xl font-bold text-gray-800">{traffic} <span className="text-lg">Mbps</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Kapasitas Puncak: 1 Gbps</p>
                                </div>
                                <div className="flex-1 bg-gray-100 h-10 rounded overflow-hidden flex items-end relative border border-gray-200">
                                    <div className="bg-gradient-to-t from-blue-400 to-blue-600 w-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ height: `${Math.min((traffic / 1000) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* CPU Load */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">CPU Load Core</h3>
                            <p className="text-2xl font-bold text-gray-800">{cpuLoad}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${cpuLoad > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${cpuLoad}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Syslog Terminal */}
                    <div className="bg-[#1e1e1e] rounded-lg p-5 font-mono text-sm shadow-xl border border-gray-700 h-72 flex flex-col">
                        <div className="flex items-center text-gray-400 mb-3 border-b border-gray-700 pb-3">
                            <Terminal className="w-5 h-5 mr-2 text-green-400" />
                            <h3 className="font-bold tracking-widest uppercase text-xs">
                                Live Syslog Stream
                                {isDemoMode && <span className="ml-3 text-amber-400 normal-case font-normal">demo data</span>}
                            </h3>
                            <div className="ml-auto flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            {formatLogs(logs)}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MANAJEMEN PERANGKAT (Dummy — akan dikembangkan bertahap) */}
            {activeTab === 'devices' && (
                <div className="space-y-6 animate-fadeIn">
                    {isDemoMode && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            <span>Data perangkat di bawah adalah <strong>contoh demo</strong>. Konfigurasikan koneksi MikroTik di halaman <strong>Integrasi Sistem</strong> untuk melihat data asli.</span>
                        </div>
                    )}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800">Daftar Perangkat Distribusi Utama (Core &amp; OLT)</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Perangkat</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4"><p className="text-sm font-bold text-gray-900">Mikrotik CCR1036 (Core)</p></td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600">10.10.10.1</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">Normal</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4"><p className="text-sm font-bold text-gray-900">OLT ZTE C320</p></td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600">10.10.10.2</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">Normal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
                        <div className="p-4 bg-blue-50 border-b border-blue-100">
                            <h3 className="font-bold text-blue-900 flex items-center">
                                <Wifi className="w-5 h-5 mr-2" /> Pemantauan Modem Pelanggan (CPE/ONT)
                            </h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Pelanggan</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP &amp; MAC</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Redaman Optik (Rx)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-blue-50/30 bg-red-50/20">
                                    <td className="px-6 py-4 font-bold text-sm">Siti Aminah</td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">192.168.1.11<br />E5:F6:A7:B8</td>
                                    <td className="px-6 py-4 text-sm font-bold text-red-600">-32.1 dBm (Kritis)</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold animate-pulse">LOS / OFFLINE</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: ALARM & INSIDEN */}
            {activeTab === 'alarms' && (
                <div className="space-y-4 animate-fadeIn">
                    {isDemoMode && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            <span>Alarm di bawah adalah <strong>contoh demo</strong>. Tombol <strong>Auto-Ticket</strong> akan tetap berfungsi dan menyimpan tiket ke database.</span>
                        </div>
                    )}
                    <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
                        <div className="p-4 bg-red-50 border-b border-red-200">
                            <h3 className="font-bold text-red-800 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" /> Log Gangguan
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            <li className="p-4 hover:bg-gray-50">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-red-600">CRITICAL: LOS (Loss of Signal) Terdeteksi</p>
                                        <p className="text-sm text-gray-800 mt-1">OLT Port PON 2: Redaman sangat buruk terpantau di ODP area <span className="font-bold">Jl. Sumatera (Pelanggan: Siti Aminah)</span>.</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => handleCreateTicket(
                                                'Gangguan LOS - Area Jl. Sumatera',
                                                'Terdeteksi sinyal LOS di ODP Jl Sumatera untuk pelanggan Siti Aminah dengan Rx power -32.1 dBm.',
                                                'los'
                                            )}
                                            className="text-xs bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 font-bold flex items-center"
                                        >
                                            <Terminal className="w-4 h-4 mr-2" /> Auto-Ticket Teknisi
                                        </button>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Modal Auto-Ticketing */}
            {showTicketModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-900 p-4 flex justify-between items-center text-white border-b-4 border-red-600">
                            <h3 className="font-bold flex items-center">
                                <Send className="w-5 h-5 mr-2 text-red-400" /> Buat Tiket Teknisi
                            </h3>
                            <button onClick={() => setShowTicketModal(false)} className="hover:bg-gray-800 p-1 rounded transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Penugasan</label>
                                <input type="text" className="w-full border border-gray-300 rounded p-2.5 bg-gray-50 text-sm" value={ticketData.title} readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Detail Gangguan</label>
                                <textarea className="w-full border border-gray-300 rounded p-2.5 bg-gray-50 text-sm h-20 resize-none" value={ticketData.desc} readOnly />
                            </div>
                            <div className="bg-gray-50 border rounded-lg p-3 flex items-center justify-between text-sm">
                                <span className="text-gray-600">Prioritas otomatis:</span>
                                <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                                    ticketData.alarmType === 'los' ? 'bg-red-100 text-red-700' :
                                    ticketData.alarmType === 'cpu_high' || ticketData.alarmType === 'link_down' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {ticketData.alarmType === 'los' ? '🔴 URGENT' :
                                     ticketData.alarmType === 'cpu_high' || ticketData.alarmType === 'link_down' ? '🟠 HIGH' :
                                     '🔵 MEDIUM'}
                                </span>
                            </div>

                            {ticketStatus === 'success' && (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 p-3 rounded-lg">
                                    <CheckCircle className="w-5 h-5" /> Tiket berhasil dibuat & dikirim ke sistem!
                                </div>
                            )}
                            {ticketStatus === 'error' && (
                                <div className="text-red-600 font-bold text-sm bg-red-50 p-3 rounded-lg">
                                    Gagal membuat tiket. Pastikan Anda sudah login.
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowTicketModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitTicket}
                                    disabled={ticketStatus === 'loading' || ticketStatus === 'success'}
                                    className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {ticketStatus === 'loading' ? (
                                        <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> Mengirim...</>
                                    ) : 'Kirim Tugas ke Teknisi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkMonitoring;