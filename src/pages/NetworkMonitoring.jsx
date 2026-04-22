import { useState, useEffect } from 'react';
import { Activity, Server, AlertTriangle, RefreshCw, Terminal, Download } from 'lucide-react';

const NetworkMonitoring = () => {
    // State untuk sistem Tab
    const [activeTab, setActiveTab] = useState('traffic');

    // State untuk data real-time (Simulasi)
    const [ping, setPing] = useState(12);
    const [cpuLoad, setCpuLoad] = useState(25);
    const [activeTraffic, setActiveTraffic] = useState(450);

    // Efek simulasi real-time
    useEffect(() => {
        const interval = setInterval(() => {
            setPing(Math.floor(Math.random() * (25 - 8 + 1) + 8));
            setCpuLoad(Math.floor(Math.random() * (40 - 15 + 1) + 15));
            setActiveTraffic(Math.floor(Math.random() * (600 - 300 + 1) + 300));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between items-end mb-6 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Network Operations Center</h1>
                    <p className="text-gray-500 mt-1">Area Pusat Kendali Jaringan ISP</p>
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
                    <AlertTriangle className="w-4 h-4 mr-2" /> Alarm & Insiden <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
                </button>
            </div>

            {/* KONTEN TAB 1: TRAFFIC & PERFORMA */}
            {activeTab === 'traffic' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Status Gateway (Mikrotik)</h3>
                            <p className="text-2xl font-bold text-green-600 flex items-center">
                                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></span> ONLINE
                            </p>
                            <p className="text-xs text-gray-400 mt-2">Uptime: 45 Hari, 12 Jam</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Total Bandwidth (Tx/Rx)</h3>
                            <p className="text-2xl font-bold text-gray-800">{activeTraffic} Mbps</p>
                            <p className="text-xs text-gray-400 mt-2">Kapasitas Puncak: 1 Gbps</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">CPU Load Core Router</h3>
                            <p className="text-2xl font-bold text-gray-800">{cpuLoad}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div className={`h-2 rounded-full transition-all duration-500 ${cpuLoad > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${cpuLoad}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Latency (Ping to 8.8.8.8)</h3>
                            <p className="text-2xl font-bold text-gray-800">{ping} ms</p>
                            <p className="text-xs text-gray-400 mt-2">Koneksi Sangat Stabil</p>
                        </div>
                    </div>
                </div>
            )}

            {/* KONTEN TAB 2: MANAJEMEN PERANGKAT */}
            {activeTab === 'devices' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Daftar Perangkat Utama (Distribusi)</h3>
                        <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center transition">
                            <RefreshCw className="w-4 h-4 mr-1" /> Scan Jaringan
                        </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Perangkat</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP Address</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Aksi Remote</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-900">Mikrotik CCR1036 (Core)</p>
                                    <p className="text-xs text-gray-500">Ruang Server Pusat</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-600">10.10.10.1</td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600">Normal</td>
                                <td className="px-6 py-4 flex justify-center space-x-2">
                                    <button className="p-2 bg-gray-800 text-white rounded hover:bg-gray-900" title="Buka Terminal SSH"><Terminal className="w-4 h-4" /></button>
                                    <button className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" title="Backup Config"><Download className="w-4 h-4" /></button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-900">OLT ZTE C320 (Distribusi)</p>
                                    <p className="text-xs text-gray-500">Ruang Server Pusat</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-600">10.10.10.2</td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600">Normal</td>
                                <td className="px-6 py-4 flex justify-center space-x-2">
                                    <button className="p-2 bg-gray-800 text-white rounded hover:bg-gray-900"><Terminal className="w-4 h-4" /></button>
                                    <button className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"><Download className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* KONTEN TAB 3: ALARM & INSIDEN */}
            {activeTab === 'alarms' && (
                <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden animate-fadeIn">
                    <div className="p-4 bg-red-50 border-b border-red-200 flex justify-between items-center">
                        <h3 className="font-bold text-red-800 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Log Gangguan (Real-time)
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        <li className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-red-600">CRITICAL: LOS (Loss of Signal) Terdeteksi</p>
                                    <p className="text-sm text-gray-800 mt-1">OLT Port PON 2: Kabel putus atau redaman terlalu tinggi di area <span className="font-bold">Jl. Sumatera, Jember Kota</span>.</p>
                                    <p className="text-xs text-gray-500 mt-2">Dampak: 14 Pelanggan Offline</p>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">10 Menit yang lalu</span>
                            </div>
                            <div className="mt-3">
                                <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded border border-red-300 hover:bg-red-200 font-bold">Buat Tiket Teknisi</button>
                            </div>
                        </li>
                        <li className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-yellow-600">WARNING: Suhu Perangkat Tinggi</p>
                                    <p className="text-sm text-gray-800 mt-1">Switch Hub 24-Port di Tiang Area Kampus mencapai suhu 65°C.</p>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">1 Jam yang lalu</span>
                            </div>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NetworkMonitoring;