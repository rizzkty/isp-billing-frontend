import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { 
    Activity, Server, AlertTriangle,
    Terminal, TrendingUp, Globe
} from 'lucide-react';

const CHART_CAPACITY = 100;
const POLL_INTERVAL  = 15_000; // 15 detik

// ── SparklineChart ────────────────────────────────────────
const SparklineChart = ({ data, capacity }) => {
    const maxPoints = 20;
    const padding   = 5;
    const width     = 100;
    const height    = 40;
    const display   = data.slice(-maxPoints);

    if (display.length === 0)
        return <div className="w-[100px] h-[40px] opacity-20 bg-gray-100 rounded" />;

    const points = display.map((val, i) => {
        const x = (i / (maxPoints - 1 || 1)) * (width - 2 * padding) + padding;
        const y = height - padding - (Math.min(Math.max(val, 0), capacity) / capacity) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    const lastX = ((display.length - 1) / (maxPoints - 1 || 1)) * (width - 2 * padding) + padding;
    const lastY = height - padding - (Math.min(display[display.length - 1], capacity) / capacity) * (height - 2 * padding);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-[100px] h-[40px] overflow-visible">
            <polyline
                fill="none" stroke="#3b82f6" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                points={points}
                className="transition-all duration-300"
            />
            <circle cx={lastX} cy={lastY} r="3" fill="#3b82f6" className="animate-pulse" />
        </svg>
    );
};

// ── Main Component ────────────────────────────────────────
const NetworkMonitoring = () => {
    const [nocData,      setNocData]      = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [isFirstLoad,  setIsFirstLoad]  = useState(true); // ← loading screen pertama
    const [error,        setError]        = useState(null);
    const [activeTab,    setActiveTab]    = useState('traffic');
    const [isp1Data,     setIsp1Data]     = useState({ tx: 0, rx: 0, total: 0 });
    const [isp2Data,     setIsp2Data]     = useState({ tx: 0, rx: 0, total: 0 });
    const [isp1History,  setIsp1History]  = useState([]);
    const [isp2History,  setIsp2History]  = useState([]);

    const logEndRef       = useRef(null);
    const mountedRef      = useRef(true);
    const isFetchingRef   = useRef(false);
    const abortController = useRef(null);

    const TABS = [
        { id: 'traffic', label: 'Traffic & Performa',  icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'devices', label: 'Manajemen Perangkat', icon: <Server className="w-4 h-4" /> },
        { id: 'alarms',  label: 'Alarm & Insiden',     icon: <AlertTriangle className="w-4 h-4" /> },
    ];

    const fetchLiveMonitor = useCallback(async () => {
    // Guard overlap
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
        const res = await api.get('/noc/live', {
            timeout: 12000,
        });

        // Cek apakah komponen masih mounted
        if (!mountedRef.current) return;

        if (res.data.success) {
            const { cpu_load, uptime, logs, traffic, devices, alarms, stats, snmp_connected } = res.data.data;
            setNocData({ cpu_load, uptime, logs, devices, alarms, stats, snmp_connected });
            setIsp1Data({
                tx:    traffic.isp1.tx,
                rx:    traffic.isp1.rx,
                total: Number(traffic.isp1.total).toFixed(2),
            });
            setIsp2Data({
                tx:    traffic.isp2.tx,
                rx:    traffic.isp2.rx,
                total: Number(traffic.isp2.total).toFixed(2),
            });
            setIsp1History(prev => [...prev, traffic.isp1.total].slice(-20));
            setIsp2History(prev => [...prev, traffic.isp2.total].slice(-20));
            
            if (!snmp_connected) {
                setError('Mode Fallback Jaringan: Router MikroTik (SNMP) tidak terhubung. Menampilkan data sinkronisasi lokal.');
            } else {
                setError(null);
            }
        } else {
            setError(res.data.message ?? 'Gagal mengambil data dari Router.');
        }

    } catch (err) {
        if (!mountedRef.current) return;
        console.error("fetchLiveMonitor error:", err);
        setError('Gagal terhubung ke Router MikroTik.');
    } finally {
        isFetchingRef.current = false;
        if (mountedRef.current) {
            setIsFirstLoad(false);
        }
    }
}, []);

    useEffect(() => {
    mountedRef.current = true; // reset saat mount

    fetchLiveMonitor();
    const intervalId = setInterval(fetchLiveMonitor, POLL_INTERVAL);

    return () => {
        mountedRef.current = false; // tandai unmount
        clearInterval(intervalId);
        // Tidak perlu abort — request tetap jalan tapi setState di-skip
    };
}, [fetchLiveMonitor]);

    useEffect(() => {
        if (activeTab === 'traffic' && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [nocData?.logs, activeTab]);

    // ── Loading screen pertama kali ───────────────────────
    if (isFirstLoad) {
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
                <span className={`ml-2 ${log.topics?.includes('error') ? 'text-red-400' : 'text-blue-300'}`}>
                    [{log.topics || 'system'}]
                </span>
                <span className="text-gray-300 ml-2">{log.message}</span>
            </div>
        ));

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                    <Activity className="w-8 h-8 mr-3 text-blue-600" /> Network Operation Center
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-3 font-bold text-sm border-b-2 transition-colors
                            ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="mr-2">{tab.icon}</span>{tab.label}
                    </button>
                ))}
            </div>

            {/* Warning/Error Banner */}
            {error && (
                <div className={`p-4 border rounded flex items-center font-bold transition-all duration-300 ${
                    nocData?.snmp_connected === false 
                        ? 'bg-amber-50 border-amber-200 text-amber-800' 
                        : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Stats Overview */}
            {nocData?.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Status Pelanggan</p>
                            <p className="text-xl font-bold text-gray-800">
                                {nocData.stats.active_customers} <span className="text-xs text-gray-400 font-normal">/ {nocData.stats.total_customers} Aktif</span>
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Pelanggan Terisolir</p>
                            <p className="text-xl font-bold text-red-600">
                                {nocData.stats.isolated_customers} <span className="text-xs text-gray-400 font-normal">Tunggakan</span>
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Node Jaringan</p>
                            <p className="text-xl font-bold text-gray-800">
                                {nocData.stats.total_devices - nocData.stats.offline_devices} <span className="text-xs text-gray-400 font-normal">/ {nocData.stats.total_devices} Online</span>
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Tiket Gangguan</p>
                            <p className="text-xl font-bold text-orange-600">
                                {nocData.stats.active_tickets} <span className="text-xs text-gray-400 font-normal">Pending</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Traffic & Performa */}
            {activeTab === 'traffic' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Status Gateway */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Status Gateway</h3>
                            <p className="text-2xl font-bold flex items-center text-green-600">
                                <span className={`w-3 h-3 rounded-full mr-2 bg-green-500 ${nocData?.snmp_connected !== false ? 'animate-pulse' : ''}`} />
                                {nocData?.snmp_connected !== false ? 'ONLINE' : 'STANDBY'}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 font-mono">
                                Uptime: {nocData?.uptime ?? '—'}
                            </p>
                        </div>

                        {/* ISP 1 */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-200 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <h3 className="text-blue-800 text-sm font-bold mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> ISP 1 (INET)
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

                        {/* ISP 2 */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-purple-200 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                            <h3 className="text-purple-800 text-sm font-bold mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> ISP 2 (Tsel)
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
                            <p className="text-2xl font-bold text-gray-800">{nocData?.cpu_load ?? 0}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500
                                        ${(nocData?.cpu_load ?? 0) > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${nocData?.cpu_load ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Syslog Terminal */}
                    <div className="bg-[#1e1e1e] rounded-lg p-5 font-mono text-sm shadow-xl border border-gray-700 h-72 flex flex-col">
                        <div className="flex items-center text-gray-400 mb-3 border-b border-gray-700 pb-3">
                            <Terminal className="w-5 h-5 mr-2 text-green-400" />
                            <h3 className="font-bold tracking-widest uppercase text-xs">Live Syslog Stream</h3>
                            <span className="ml-auto flex items-center gap-1 text-[10px] text-green-500">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                LIVE · {POLL_INTERVAL / 1000}s
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {formatLogs(nocData?.logs)}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Manajemen Perangkat */}
            {activeTab === 'devices' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-gray-800">Daftar Perangkat & Node Jaringan</h3>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                            {nocData?.devices?.length || 0} Terdeteksi
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                                    <th className="p-4">Nama Node</th>
                                    <th className="p-4">Tipe</th>
                                    <th className="p-4">Deskripsi / Lokasi</th>
                                    <th className="p-4">Koordinat</th>
                                    <th className="p-4 text-center">Pelanggan Terhubung</th>
                                    <th className="p-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {nocData?.devices?.map((dev) => (
                                    <tr key={dev.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                                            <Server className="w-4 h-4 text-gray-400" />
                                            {dev.name}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                dev.type === 'SERVER' ? 'bg-indigo-100 text-indigo-800' :
                                                dev.type === 'ODC' ? 'bg-purple-100 text-purple-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {dev.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs">{dev.description || '-'}</td>
                                        <td className="p-4 text-gray-500 font-mono text-xs">{dev.lat}, {dev.lng}</td>
                                        <td className="p-4 text-center font-semibold">
                                            {dev.type === 'ODP' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-gray-900">{dev.connected_clients}/{dev.max_ports}</span>
                                                    <span className="text-xs text-gray-400">({Math.round((dev.connected_clients/dev.max_ports)*100)}%)</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                dev.status === 'offline' 
                                                    ? 'bg-red-100 text-red-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    dev.status === 'offline' ? 'bg-red-500' : 'bg-green-500 animate-pulse'
                                                }`} />
                                                {dev.status === 'offline' ? 'OFFLINE' : 'ONLINE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!nocData?.devices || nocData.devices.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400">
                                            Tidak ada node jaringan terdaftar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Alarm & Insiden */}
            {activeTab === 'alarms' && (
                <div className="space-y-6">
                    {nocData?.alarms && nocData.alarms.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <h3 className="font-bold text-gray-800">Alarm & Insiden Aktif</h3>
                                </div>
                                <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full">
                                    {nocData.alarms.length} Gangguan Terdeteksi
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {nocData.alarms.map((alarm) => (
                                    <div key={`${alarm.type}-${alarm.id}`} className="p-5 hover:bg-gray-50 transition-colors flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className={`p-2 rounded-lg ${
                                                alarm.type === 'ticket' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                <AlertTriangle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">{alarm.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Pelanggan: <span className="font-semibold text-gray-700">{alarm.customer_name}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2 font-mono">
                                                    Dideteksi sejak: {new Date(alarm.created_at).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                                                alarm.priority === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                alarm.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                'bg-blue-100 text-blue-800 border border-blue-200'
                                            }`}>
                                                {alarm.priority} PRIORITY
                                            </span>
                                            <span className="text-xs font-semibold text-gray-400 uppercase font-mono">
                                                Kategori: {alarm.type === 'ticket' ? 'Gangguan Teknis' : 'Administrasi'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                <Globe className="w-10 h-10 animate-pulse" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-1">Semua Sistem Normal</h3>
                            <p className="text-gray-500 max-w-sm">Tidak ada alarm aktif saat ini. Semua pelanggan terhubung dan tiket gangguan telah diselesaikan.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NetworkMonitoring;