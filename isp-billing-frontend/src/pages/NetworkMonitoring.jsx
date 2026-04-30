import { useState, useEffect, useRef } from 'react';
import { Activity, Server, AlertTriangle, Terminal, Wifi, X, CheckCircle, Send, ChevronDown } from 'lucide-react';

const NetworkMonitoring = () => {
    // State untuk sistem Tab
    const [activeTab, setActiveTab] = useState('traffic');

    // State untuk data real-time dari API Laravel
    const [cpuLoad, setCpuLoad] = useState(0);
    const [uptime, setUptime] = useState('Menghitung...');
    const [syslogs, setSyslogs] = useState(['[Sistem] Menghubungkan ke MikroTik API...']);
    const [statusGateway, setStatusGateway] = useState('CONNECTING');
    
    // Traffic masih disimulasikan sementara sampai Anda menentukan interface WAN-nya
    const [activeTraffic, setActiveTraffic] = useState(0); 
    
    const logEndRef = useRef(null);

    // State untuk Auto-Ticketing
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState({ title: '', desc: '' });

    // Fungsi Fetch ke Backend Laravel
    const fetchNocData = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/noc/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    apiIp: '172.16.0.1', 
                    apiPort: '8728',
                    apiUser: 'tekhnisi',
                    apiPass: 'PASSWORD_MIKROTIK_ANDA' // <-- GANTI INI
                })
            });
            const result = await response.json();
            
            if (result.success) {
                setStatusGateway('ONLINE');
                setCpuLoad(result.data.cpu_load);
                setUptime(result.data.uptime);
                
                // Memformat log bawaan MikroTik agar rapi
                const formattedLogs = result.data.logs.map(log => {
                    const time = log.time || new Date().toLocaleTimeString();
                    const topic = log.topics || 'system';
                    return `[${time}] [${topic}] ${log.message}`;
                });
                setSyslogs(formattedLogs);
            } else {
                setStatusGateway('ERROR');
            }
        } catch (error) {
            console.error("Gagal menarik data live:", error);
            setStatusGateway('OFFLINE');
        }
    };

    // Efek Polling Real-time (menarik data setiap 3 detik)
    useEffect(() => {
        fetchNocData(); // Tarik data pertama kali

        const interval = setInterval(() => {
            fetchNocData(); // Tarik data MikroTik asli
            // Simulasi traffic untuk sementara
            setActiveTraffic(Math.floor(Math.random() * (900 - 300 + 1) + 300));
        }, 3000); 

        return () => clearInterval(interval);
    }, []);

    // Auto scroll syslog ke bawah saat ada log baru
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [syslogs]);

    const handleCreateTicket = (title, desc) => {
        setTicketData({ title, desc });
        setShowTicketModal(true);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-end mb-6 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Network Operations Center</h1>
                    <p className="text-gray-500 mt-1">Area Pusat Kendali Jaringan ISP (Enterprise Level)</p>
                </div>
            </div>

            {/* Menu Navigasi (Tabs) Internal NOC */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
                <button 
                    onClick={() => setActiveTab('traffic')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'traffic' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    <Activity className="w-4 h-4 mr-2" /> Traffic & Performa
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
                    <AlertTriangle className="w-4 h-4 mr-2" /> Alarm & Insiden <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">1</span>
                </button>
            </div>

            {/* KONTEN TAB 1: TRAFFIC & PERFORMA */}
            {activeTab === 'traffic' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Status Gateway (Core)</h3>
                            {statusGateway === 'ONLINE' ? (
                                <p className="text-2xl font-bold text-green-600 flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></span> ONLINE
                                </p>
                            ) : (
                                <p className="text-2xl font-bold text-red-600 flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> OFFLINE
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 font-mono">Uptime: {uptime}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-2">
                            <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Bandwidth (Tx/Rx)</h3>
                            <div className="flex items-end gap-4">
                                <div className="min-w-[120px]">
                                    <p className="text-3xl font-bold text-gray-800">{activeTraffic} <span className="text-lg">Mbps</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Kapasitas Puncak: 1 Gbps</p>
                                </div>
                                <div className="flex-1 bg-gray-100 h-10 rounded overflow-hidden flex items-end relative border border-gray-200">
                                    <div className="absolute inset-0 grid grid-rows-4 opacity-10">
                                        <div className="border-b border-gray-400"></div>
                                        <div className="border-b border-gray-400"></div>
                                        <div className="border-b border-gray-400"></div>
                                    </div>
                                    <div className="bg-gradient-to-t from-blue-400 to-blue-600 w-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ height: `${(activeTraffic / 1000) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">CPU Load Core</h3>
                            <p className="text-2xl font-bold text-gray-800">{cpuLoad}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div className={`h-2 rounded-full transition-all duration-500 ${cpuLoad > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${cpuLoad}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Syslog Terminal (Real-time from MikroTik) */}
                    <div className="bg-[#1e1e1e] rounded-lg p-5 font-mono text-sm shadow-xl border border-gray-700 h-72 flex flex-col">
                        <div className="flex items-center text-gray-400 mb-3 border-b border-gray-700 pb-3">
                            <Terminal className="w-5 h-5 mr-2 text-green-400" />
                            <h3 className="font-bold tracking-widest uppercase text-xs">Live Syslog Stream</h3>
                            <div className="ml-auto flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600">
                            {syslogs.map((log, i) => {
                                // Memecah string log "[Waktu] [Topik] Pesan" untuk diwarnai
                                const parts = log.split('] ');
                                const time = parts[0] + ']';
                                const topic = parts.length > 1 ? parts[1] + ']' : '';
                                const message = parts.slice(2).join('] ');

                                return (
                                    <div key={i} className="mb-1">
                                        <span className="text-green-400">{time}</span> 
                                        <span className="text-blue-300 ml-2">{topic}</span> 
                                        <span className="text-gray-300 ml-2">{message || log}</span>
                                    </div>
                                );
                            })}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB MANAJEMEN PERANGKAT (Tetap Sama) */}
            {activeTab === 'devices' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Daftar Perangkat Distribusi Utama (Core & OLT)</h3>
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
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-900">Mikrotik CCR1036 (Core)</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600">10.10.10.1</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">Normal</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-900">OLT ZTE C320</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600">10.10.10.2</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">Normal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden mt-6">
                        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="font-bold text-blue-900 flex items-center">
                                <Wifi className="w-5 h-5 mr-2" /> Pemantauan Modem Pelanggan (CPE/ONT)
                            </h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Pelanggan</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP & MAC</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Redaman Optik (Rx)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-blue-50/30 bg-red-50/20">
                                    <td className="px-6 py-4 font-bold text-sm">Siti Aminah</td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">192.168.1.11<br/>E5:F6:A7:B8</td>
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

            {/* TAB ALARM & INSIDEN (Tetap Sama) */}
            {activeTab === 'alarms' && (
                <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden animate-fadeIn">
                    <div className="p-4 bg-red-50 border-b border-red-200 flex justify-between items-center">
                        <h3 className="font-bold text-red-800 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Log Gangguan (Real-time)
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        <li className="p-4 hover:bg-gray-50">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div>
                                    <p className="text-sm font-bold text-red-600">CRITICAL: LOS (Loss of Signal) Terdeteksi</p>
                                    <p className="text-sm text-gray-800 mt-1">OLT Port PON 2: Redaman sangat buruk terpantau di ODP area <span className="font-bold">Jl. Sumatera (Pelanggan: Siti Aminah)</span>.</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button 
                                        onClick={() => handleCreateTicket('Gangguan LOS - Area Jl Sumatera', 'Terdeteksi sinyal LOS di ODP Jl Sumatera untuk pelanggan Siti Aminah dengan Rx power -32.1 dBm.')}
                                        className="text-xs bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 font-bold flex items-center"
                                    >
                                        <Terminal className="w-4 h-4 mr-2"/> Auto-Ticket Teknisi
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            )}

            {/* Modal Auto-Ticketing (Tetap Sama) */}
            {showTicketModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideIn">
                        <div className="bg-gray-900 p-4 flex justify-between items-center text-white border-b-4 border-red-600">
                            <h3 className="font-bold flex items-center">
                                <Send className="w-5 h-5 mr-2 text-red-400" /> Integrasi Auto-Ticketing
                            </h3>
                            <button onClick={() => setShowTicketModal(false)} className="hover:bg-gray-800 p-1 rounded transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Judul Penugasan</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2.5 mb-4 bg-gray-50" value={ticketData.title} readOnly />
                            <div className="flex gap-3">
                                <button onClick={() => setShowTicketModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition">Batal</button>
                                <button onClick={() => { alert('Tiket dikirim!'); setShowTicketModal(false); }} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition">Kirim Tugas</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkMonitoring;