import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Activity, Server, Wifi, AlertTriangle, Send, 
    Terminal, TrendingUp, CheckCircle, Zap, X, 
    Cpu, Clock, Users
} from 'lucide-react';

const CHART_CAPACITY = 1000;

// ── COMPONENT: SparklineChart ────────────────────────────────────────────────
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
            <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="transition-all duration-300"
            />
            {displayData.length > 0 && (
                <circle
                    cx={(displayData.length - 1) / (maxDataPoints - 1 || 1) * (width - 2 * padding) + padding}
                    cy={height - padding - (Math.min(displayData[displayData.length - 1], capacity) / capacity) * (height - 2 * padding)}
                    r="3"
                    fill="#3b82f6"
                    className="animate-pulse"
                />
            )}
        </svg>
    );
};

// ── COMPONENT: SeverityBadge ─────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
    const config = {
        critical: 'bg-red-500 text-white shadow-red-200',
        high:     'bg-orange-500 text-white shadow-orange-200',
        warning:  'bg-yellow-400 text-yellow-900 shadow-yellow-200',
        info:     'bg-blue-500 text-white shadow-blue-200'
    };
    const cls = config[severity] || config.info;
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm ${cls}`}>
            {severity}
        </span>
    );
};

// ── CONFIG: DEVICE_STATUS ────────────────────────────────────────────────────
const DEVICE_STATUS = {
    online:  { color: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50' },
    warning: { color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200', bg: 'bg-yellow-50' },
    offline: { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
};

// ── COMPONENT: DeviceCard ────────────────────────────────────────────────────
const DeviceCard = ({ device }) => {
    const statusConfig = DEVICE_STATUS[device.status] || DEVICE_STATUS.offline;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border ${statusConfig.border} overflow-hidden hover:shadow-md transition-shadow relative`}>
            {/* Indikator Status Dot */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className={`text-xs font-bold ${statusConfig.text} uppercase`}>{device.status}</span>
                <span className={`w-3 h-3 rounded-full ${statusConfig.color} ${device.status !== 'offline' ? 'animate-pulse' : ''}`}></span>
            </div>

            <div className={`p-4 ${statusConfig.bg} border-b ${statusConfig.border}`}>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Server className={`w-5 h-5 ${statusConfig.text}`} />
                    {device.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{device.ip} • {device.type.toUpperCase()}</p>
            </div>

            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU Load</p>
                        <p className="text-sm font-bold text-gray-800">{device.cpu_load}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                                className={`h-1.5 rounded-full ${device.cpu_load > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(device.cpu_load, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3"/> Latency</p>
                        <p className={`text-sm font-bold ${device.latency > 100 ? 'text-orange-500' : 'text-gray-800'}`}>
                            {device.latency} ms
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Uptime</p>
                        <p className="text-xs font-semibold text-gray-700">{device.uptime}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3"/> Clients</p>
                        <p className="text-xs font-semibold text-gray-700">{device.clients_count}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── MAIN COMPONENT: NetworkMonitoring ────────────────────────────────────────
const NetworkMonitoring = () => {
    const [nocData, setNocData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('traffic');
    const [trafficHistory, setTrafficHistory] = useState([]);
    const logEndRef = useRef(null);

    // Modal state
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState({ title: '', desc: '', alarmType: '' });
    const [ticketStatus, setTicketStatus] = useState('idle'); // idle, loading, success, error

    const TABS = [
        { id: 'traffic', label: 'Traffic & Performa', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'devices', label: 'Manajemen Perangkat', icon: <Server className="w-4 h-4" /> },
        { id: 'alarms', label: 'Alarm & Insiden', icon: <AlertTriangle className="w-4 h-4" />, badge: nocData?.alarms?.length || 0 }
    ];

    useEffect(() => {
        const fetchNocData = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/noc/stats');
                const rootData = response.data;
                const data = rootData.data;
                setNocData({ ...data, is_demo: rootData.is_demo });
                
                // Update chart
                setTrafficHistory(prev => {
                    const newHist = [...prev, data.traffic];
                    return newHist.slice(-20);
                });
                
                setError(null);
            } catch (err) {
                console.error("Gagal mengambil data NOC:", err);
                setError("Gagal terhubung ke service NOC.");
            } finally {
                setLoading(false);
            }
        };

        fetchNocData();
        const interval = setInterval(fetchNocData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll log terminal
    useEffect(() => {
        if (activeTab === 'traffic' && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [nocData?.logs, activeTab]);

    const handleCreateTicket = (title, desc, type) => {
        setTicketData({ title: `[AUTO] Penanganan: ${title}`, desc, alarmType: type });
        setTicketStatus('idle');
        setShowTicketModal(true);
    };

    const handleSubmitTicket = async () => {
        setTicketStatus('loading');
        try {
            const token = localStorage.getItem('isp_auth');
            
            // Map alarmType to priority
            let priority = 'medium';
            if (ticketData.alarmType === 'los') priority = 'urgent';
            else if (['cpu_high', 'link_down'].includes(ticketData.alarmType)) priority = 'high';

            await axios.post('http://127.0.0.1:8000/api/tickets', {
                title: ticketData.title,
                description: ticketData.desc,
                category: 'technical',
                priority: priority
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTicketStatus('success');
            setTimeout(() => {
                setShowTicketModal(false);
            }, 2000);
        } catch (err) {
            console.error("Gagal membuat tiket otomatis:", err);
            setTicketStatus('error');
        }
    };

    if (loading && !nocData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Activity className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                <p className="font-semibold text-lg animate-pulse">Menghubungkan ke Gateway NOC...</p>
            </div>
        );
    }

    if (error && !nocData) {
        return (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-700 mb-2">Network Operation Center Offline</h3>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    // ── Derived state ────────────────────────────────────────────────────────
    const isDemoMode = nocData?.is_demo === true;
    const statusGateway = isDemoMode ? 'DEMO' : 'ONLINE';
    const cpuLoad    = nocData?.cpu_load    ?? 0;
    const uptime     = nocData?.uptime      ?? 'Menghubungkan...';
    const traffic    = nocData?.traffic     ?? 0;
    const logs       = nocData?.logs        ?? [{ time: '--:--', topics: 'system', message: 'Menghubungkan ke server...' }];
    const alarms     = nocData?.alarms      ?? [];
    const devices    = nocData?.devices     ?? [];
    const ontDevices = nocData?.ont_devices ?? [];

    // ── Format logs ──────────────────────────────────────────────────────────
    const formatLogs = (logList = []) =>
        logList.map((log, i) => (
            <div key={i} className="mb-1">
                <span className="text-green-400">[{log.time || '--:--'}]</span>
                <span className={`ml-2 ${log.topics === 'error' ? 'text-red-400' : 'text-blue-300'}`}>
                    [{log.topics || 'system'}]
                </span>
                <span className="text-gray-300 ml-2">{log.message}</span>
            </div>
        ));

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn bg-gray-50 min-h-screen space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <Activity className="w-8 h-8 mr-3 text-blue-600" />
                        Network Operation Center
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Pemantauan infrastruktur dan gateway utama</p>
                </div>
            </div>

            {/* ── TABS NAV ─────────────────────────────────────────────────────── */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                        {tab.badge > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: TRAFFIC & PERFORMA ────────────────────────────────────── */}
            {activeTab === 'traffic' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Status Gateway */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">Status Gateway (Core)</h3>
                            <p className={`text-2xl font-bold flex items-center ${
                                statusGateway === 'ONLINE' ? 'text-green-600' :
                                statusGateway === 'DEMO'   ? 'text-amber-500' : 'text-red-600'
                            }`}>
                                <span className={`w-3 h-3 rounded-full mr-2 ${
                                    statusGateway === 'ONLINE' ? 'bg-green-500 animate-pulse' :
                                    statusGateway === 'DEMO'   ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
                                }`}></span>
                                {statusGateway}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 font-mono">Uptime: {uptime}</p>
                        </div>

                        {/* Bandwidth + Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-2">
                            <h3 className="text-gray-500 text-sm font-semibold mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Total Bandwidth (Tx+Rx)
                                {isDemoMode && <span className="text-amber-500 text-xs font-normal">— simulasi</span>}
                            </h3>
                            <div className="flex items-end gap-4">
                                <div className="min-w-[100px]">
                                    <p className="text-3xl font-bold text-gray-800">{traffic} <span className="text-lg">Mbps</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Maks: {CHART_CAPACITY} Mbps</p>
                                </div>
                                <SparklineChart data={trafficHistory} capacity={CHART_CAPACITY} />
                            </div>
                        </div>

                        {/* CPU Load */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-semibold mb-1">CPU Load Core</h3>
                            <p className="text-2xl font-bold text-gray-800">{cpuLoad}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${cpuLoad > 80 ? 'bg-red-500' : cpuLoad > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                    style={{ width: `${cpuLoad}%` }}
                                ></div>
                            </div>
                            <p className={`text-xs mt-2 font-semibold ${cpuLoad > 80 ? 'text-red-500' : 'text-gray-400'}`}>
                                {cpuLoad > 80 ? '⚠ Beban Tinggi!' : 'Normal'}
                            </p>
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
                        <div className="flex-1 overflow-y-auto">
                            {formatLogs(logs)}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: MANAJEMEN PERANGKAT ───────────────────────────────────── */}
            {activeTab === 'devices' && (
                <div className="space-y-6 animate-fadeIn">
                    {isDemoMode && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            <span>Data perangkat di bawah adalah <strong>contoh demo</strong>. Konfigurasikan MikroTik di halaman <strong>Integrasi Sistem</strong> untuk health check real via Ping otomatis.</span>
                        </div>
                    )}

                    {/* Summary stats */}
                    {devices.length > 0 && (() => {
                        const online  = devices.filter(d => d.status === 'online').length;
                        const warning = devices.filter(d => d.status === 'warning').length;
                        const offline = devices.filter(d => d.status === 'offline').length;
                        return (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-green-600">{online}</p>
                                    <p className="text-sm text-green-700 font-semibold mt-1">Online</p>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-yellow-600">{warning}</p>
                                    <p className="text-sm text-yellow-700 font-semibold mt-1">Lambat / Warning</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-red-600">{offline}</p>
                                    <p className="text-sm text-red-700 font-semibold mt-1">Offline</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Device Cards Grid */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Server className="w-4 h-4" /> Perangkat Jaringan (Core, OLT, ODC, Switch)
                        </h3>
                        {devices.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                                <Server className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>Belum ada data perangkat.</p>
                                <p className="text-xs mt-1">Tambahkan node ke Peta Jaringan dengan type "server" atau "odc".</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {devices.map(device => (
                                    <DeviceCard key={device.id} device={device} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ONT/CPE Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                            <h3 className="font-bold text-blue-900 flex items-center">
                                <Wifi className="w-5 h-5 mr-2" /> Pemantauan Modem Pelanggan (CPE/ONT)
                            </h3>
                            {isDemoMode && (
                                <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Demo</span>
                            )}
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Pelanggan</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP &amp; MAC</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paket</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Redaman (Rx)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ontDevices.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-sm">
                                            Belum ada data ONT. Perlu integrasi API OLT.
                                        </td>
                                    </tr>
                                ) : ontDevices.map((ont, i) => {
                                    const isLos     = ont.status === 'los';
                                    const isWarning = ont.status === 'warning';
                                    const dbmColor  = isLos ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600';
                                    const dbmLabel  = isLos ? '(Kritis)' : isWarning ? '(Lemah)' : '(Baik)';
                                    const rowBg     = isLos ? 'bg-red-50/30' : isWarning ? 'bg-yellow-50/20' : '';
                                    return (
                                        <tr key={i} className={`hover:bg-blue-50/30 ${rowBg}`}>
                                            <td className="px-6 py-4 font-bold text-sm text-gray-900">{ont.customer_name}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-500">{ont.ip}<br />{ont.mac}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{ont.package}</td>
                                            <td className={`px-6 py-4 text-sm font-bold ${dbmColor}`}>
                                                {ont.rx_dbm} dBm <span className="font-normal text-xs">{dbmLabel}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isLos ? (
                                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold animate-pulse">LOS / OFFLINE</span>
                                                ) : isWarning ? (
                                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Sinyal Lemah</span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Online</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB 3: ALARM & INSIDEN ───────────────────────────────────────── */}
            {activeTab === 'alarms' && (
                <div className="space-y-4 animate-fadeIn">
                    {isDemoMode && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            <span>Alarm ini adalah <strong>contoh demo</strong>. Tombol <strong>Auto-Ticket</strong> tetap berfungsi dan menyimpan ke database.</span>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
                        <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
                            <h3 className="font-bold text-red-800 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" /> Log Gangguan
                            </h3>
                            <span className="text-xs text-red-600 font-semibold">{alarms.length} alarm aktif</span>
                        </div>

                        {alarms.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                                <p className="font-semibold">Tidak ada alarm aktif</p>
                                <p className="text-sm">Semua sistem berjalan normal.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {alarms.map((alarm, idx) => (
                                    <li key={idx} className="p-4 hover:bg-gray-50">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <SeverityBadge severity={alarm.severity} />
                                                    <p className="text-sm font-bold text-gray-800">{alarm.title}</p>
                                                </div>
                                                <p className="text-sm text-gray-600">{alarm.detail}</p>
                                                <p className="text-xs text-gray-400 mt-1 font-mono">Terdeteksi: {alarm.time}</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => handleCreateTicket(
                                                        alarm.title,
                                                        alarm.detail + ` [Terdeteksi: ${alarm.time}]`,
                                                        alarm.type
                                                    )}
                                                    className="text-xs bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 font-bold flex items-center whitespace-nowrap"
                                                >
                                                    <Terminal className="w-4 h-4 mr-2" /> Auto-Ticket
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL AUTO-TICKET ─────────────────────────────────────────────── */}
            {showTicketModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-900 p-4 flex justify-between items-center text-white border-b-4 border-red-600">
                            <h3 className="font-bold flex items-center">
                                <Send className="w-5 h-5 mr-2 text-red-400" /> Buat Tiket Teknisi
                            </h3>
                            <button onClick={() => setShowTicketModal(false)} className="hover:bg-gray-800 p-1 rounded transition">
                                <X className="w-5 h-5" />
                            </button>
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
                                    ticketData.alarmType === 'los'                                              ? 'bg-red-100 text-red-700' :
                                    ticketData.alarmType === 'cpu_high' || ticketData.alarmType === 'link_down' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {ticketData.alarmType === 'los'                                              ? '🔴 URGENT' :
                                     ticketData.alarmType === 'cpu_high' || ticketData.alarmType === 'link_down' ? '🟠 HIGH' :
                                     '🔵 MEDIUM'}
                                </span>
                            </div>

                            {ticketStatus === 'success' && (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 p-3 rounded-lg">
                                    <CheckCircle className="w-5 h-5" /> Tiket berhasil dibuat &amp; dikirim ke sistem!
                                </div>
                            )}
                            {ticketStatus === 'error' && (
                                <div className="text-red-600 font-bold text-sm bg-red-50 p-3 rounded-lg">
                                    Gagal membuat tiket. Pastikan Anda sudah login.
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowTicketModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition">
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitTicket}
                                    disabled={ticketStatus === 'loading' || ticketStatus === 'success'}
                                    className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {ticketStatus === 'loading'
                                        ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> Mengirim...</>
                                        : 'Kirim Tugas ke Teknisi'
                                    }
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