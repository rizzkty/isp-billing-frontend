import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Activity, Server, Wifi, AlertTriangle, Send, 
    Terminal, TrendingUp, CheckCircle, Zap, X, 
    Cpu, Clock, Users, Globe
} from 'lucide-react';

const CHART_CAPACITY = 100;

// ── COMPONENT: SparklineChart (Tetap Sama) ────────────────────────────────────────────────
const SparklineChart = ({ data, capacity }) => {
    const maxDataPoints = 20;
    const padding = 5;
    const width = 100;
    const height = 40;
    const displayData = data.slice(-maxDataPoints);
    if (displayData.length === 0) return <div className="w-[100px] h-[40px] opacity-20 bg-gray-100 rounded"></div>;
    const points = displayData.map((val, index) => {
        const x = (index / (maxDataPoints - 1 || 1)) * (width - 2 * padding) + padding;
        const normalizedVal = Math.min(Math.max(val, 0), capacity);
        const y = height - padding - (normalizedVal / capacity) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-[100px] h-[40px] overflow-visible">
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} className="transition-all duration-300" />
            {displayData.length > 0 && (
                <circle cx={(displayData.length - 1) / (maxDataPoints - 1 || 1) * (width - 2 * padding) + padding} cy={height - padding - (Math.min(displayData[displayData.length - 1], capacity) / capacity) * (height - 2 * padding)} r="3" fill="#3b82f6" className="animate-pulse" />
            )}
        </svg>
    );
};

// ── MAIN COMPONENT ────────────────────────────────────────
const NetworkMonitoring = () => {
    const [nocData, setNocData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('traffic');
    const logEndRef = useRef(null);

    const [isp1Data, setIsp1Data] = useState({ tx: 0, rx: 0, total: 0 });
    const [isp2Data, setIsp2Data] = useState({ tx: 0, rx: 0, total: 0 });
    const [isp1History, setIsp1History] = useState([]);
    const [isp2History, setIsp2History] = useState([]);

    const TABS = [
        { id: 'traffic', label: 'Traffic & Performa', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'devices', label: 'Manajemen Perangkat', icon: <Server className="w-4 h-4" /> },
        { id: 'alarms', label: 'Alarm & Insiden', icon: <AlertTriangle className="w-4 h-4" />, badge: 0 }
    ];

    // MENGGUNAKAN METODE POLLING TERPADU (Setiap 3 Detik)
    useEffect(() => {
        let isMounted = true;

        const fetchLiveMonitor = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:8000/api/noc/live');
                if (res.data.success && isMounted) {
                    const data = res.data.data;
                    
                    // Update Status & Logs
                    setNocData({
                        cpu_load: data.cpu_load,
                        uptime: data.uptime,
                        logs: data.logs,
                        is_demo: false
                    });

                    // Update Traffic
                    const traffic = data.traffic;
                    setIsp1Data({ tx: traffic.isp1.tx, rx: traffic.isp1.rx, total: traffic.isp1.total.toFixed(2) });
                    setIsp2Data({ tx: traffic.isp2.tx, rx: traffic.isp2.rx, total: traffic.isp2.total.toFixed(2) });
                    
                    // Update Grafik
                    setIsp1History(prev => [...prev, traffic.isp1.total].slice(-20));
                    setIsp2History(prev => [...prev, traffic.isp2.total].slice(-20));
                    
                    setError(null);
                }
            } catch (err) {
                console.error("Gagal terhubung ke Router");
                if (isMounted) setError("Gagal mengambil data dari Router MikroTik.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Tarik data pertama kali
        fetchLiveMonitor();

        // Ulangi setiap 3 detik
        const intervalId = setInterval(fetchLiveMonitor, 3000);

        // Bersihkan interval saat pindah halaman agar tidak spam
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    // Auto-scroll terminal log
    useEffect(() => {
        if (activeTab === 'traffic' && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [nocData?.logs, activeTab]);

    if (loading && !nocData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Activity className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                <p className="font-semibold text-lg animate-pulse">Mengambil data dari Router...</p>
            </div>
        );
    }

    const formatLogs = (logList = []) =>
        logList.map((log, i) => (
            <div key={i} className="mb-1">
                <span className="text-green-400">[{log.time || '--:--'}]</span>
                <span className={`ml-2 ${log.topics === 'error' ? 'text-red-400' : 'text-blue-300'}`}>[{log.topics || 'system'}]</span>
                <span className="text-gray-300 ml-2">{log.message}</span>
            </div>
        ));

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn bg-gray-50 min-h-screen space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <Activity className="w-8 h-8 mr-3 text-blue-600" /> Network Operation Center
                    </h1>
                </div>
            </div>

            <div className="flex border-b border-gray-200 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-6 py-3 font-bold text-sm border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <span className="mr-2">{tab.icon}</span>{tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 p-4 border border-red-200 text-red-600 rounded flex items-center font-bold">
                    <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            {activeTab === 'traffic' && nocData && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* Status Uptime */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Status Gateway</h3>
                            <p className="text-2xl font-bold flex items-center text-green-600">
                                <span className="w-3 h-3 rounded-full mr-2 bg-green-500 animate-pulse"></span>ONLINE
                            </p>
                            <p className="text-xs text-gray-400 mt-2 font-mono">Uptime: {nocData.uptime}</p>
                        </div>

                        {/* Traffic ISP 1 */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-200 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <h3 className="text-blue-800 text-sm font-bold mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> ISP 1 (INET)</span>
                            </h3>
                            <div className="flex items-end justify-between mb-2">
                                <div>
                                    <p className="text-3xl font-bold text-gray-800 tracking-tight">{isp1Data.total}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Mbps Total</p>
                                </div>
                                <SparklineChart data={isp1History} capacity={CHART_CAPACITY} />
                            </div>
                            <div className="text-[10px] text-gray-500 flex justify-between border-t border-gray-100 pt-2 font-mono">
                                <span>↓ Rx: <span className="font-bold text-blue-600">{isp1Data.rx}</span></span>
                                <span>↑ Tx: <span className="font-bold text-green-600">{isp1Data.tx}</span></span>
                            </div>
                        </div>

                        {/* Traffic ISP 2 */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-purple-200 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <h3 className="text-purple-800 text-sm font-bold mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> ISP 2 (Tsel)</span>
                            </h3>
                            <div className="flex items-end justify-between mb-2">
                                <div>
                                    <p className="text-3xl font-bold text-gray-800 tracking-tight">{isp2Data.total}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Mbps Total</p>
                                </div>
                                <SparklineChart data={isp2History} capacity={CHART_CAPACITY} />
                            </div>
                            <div className="text-[10px] text-gray-500 flex justify-between border-t border-gray-100 pt-2 font-mono">
                                <span>↓ Rx: <span className="font-bold text-blue-600">{isp2Data.rx}</span></span>
                                <span>↑ Tx: <span className="font-bold text-green-600">{isp2Data.tx}</span></span>
                            </div>
                        </div>

                        {/* CPU Load */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">CPU Load Core</h3>
                            <p className="text-2xl font-bold text-gray-800">{nocData.cpu_load}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div className={`h-2 rounded-full transition-all duration-500 ${nocData.cpu_load > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${nocData.cpu_load}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Syslog */}
                    <div className="bg-[#1e1e1e] rounded-lg p-5 font-mono text-sm shadow-xl border border-gray-700 h-72 flex flex-col">
                        <div className="flex items-center text-gray-400 mb-3 border-b border-gray-700 pb-3">
                            <Terminal className="w-5 h-5 mr-2 text-green-400" />
                            <h3 className="font-bold tracking-widest uppercase text-xs">Live Syslog Stream</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {formatLogs(nocData.logs)}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkMonitoring;