import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Server, AlertTriangle, Terminal, Wifi, X, CheckCircle, Send, Zap, Radio, TrendingUp, Cpu, Clock, Users, Gauge } from 'lucide-react';
import api from '../api';

// ─── Konstanta ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL   = 5000;   // ms
const CHART_MAX_POINTS = 20;   // jumlah titik di sparkline chart
const CHART_CAPACITY   = 1000; // Mbps kapasitas puncak

// ─── Komponen Sparkline Chart (SVG, tanpa library eksternal) ──────────────────
const SparklineChart = ({ data, capacity = CHART_CAPACITY }) => {
    const w = 300;
    const h = 60;
    const pad = 4;

    if (!data || data.length < 2) {
        return <div className="flex-1 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">Mengumpulkan data...</div>;
    }

    const max = Math.max(capacity, ...data);
    const pts = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v / max) * (h - pad * 2));
        return `${x},${y}`;
    }).join(' ');

    const fillPts = `${pad},${h} ` + pts + ` ${w - pad},${h}`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 h-14" preserveAspectRatio="none">
            <defs>
                <linearGradient id="tgr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <polygon points={fillPts} fill="url(#tgr)" />
            <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
};

// ─── Badge severity ─────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
    const map = {
        critical: 'bg-red-100 text-red-800 border-red-300',
        high:     'bg-orange-100 text-orange-800 border-orange-300',
        medium:   'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${map[severity] || map.medium}`}>
            {severity?.toUpperCase()}
        </span>
    );
};

// ─── Device Status Config ────────────────────────────────────────────────────
const DEVICE_STATUS = {
    online:  { dot: 'bg-green-400 animate-pulse', badge: 'bg-green-100 text-green-800 border-green-300',  label: 'Online',  border: 'border-green-200' },
    warning: { dot: 'bg-yellow-400 animate-pulse', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Lambat', border: 'border-yellow-200' },
    offline: { dot: 'bg-red-500',                  badge: 'bg-red-100 text-red-800 border-red-300',         label: 'Offline', border: 'border-red-200'   },
};

// ─── Device Card Component ───────────────────────────────────────────────────
const DeviceCard = ({ device }) => {
    const st = DEVICE_STATUS[device.status] || DEVICE_STATUS.offline;
    const typeLabel = { server: 'Core / OLT', odc: 'ODC / Switch', odp: 'ODP' }[device.type] || device.type;

    return (
        <div className={`bg-white rounded-xl border-2 ${st.border} shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot}`}></div>
                    <p className="text-sm font-bold text-gray-800 truncate">{device.name}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.badge}`}>
                    {st.label}
                </span>
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-500 space-y-1">
                <p className="font-mono">{device.ip}</p>
                <p className="truncate">{device.location || '-'}</p>
                <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">{typeLabel}</span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Latency */}
                <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center">
                    <Gauge className="w-4 h-4 text-blue-500 mb-1" />
                    <p className="font-bold text-gray-800">
                        {device.latency != null ? `${device.latency} ms` : '—'}
                    </p>
                    <p className="text-gray-400">Latency</p>
                </div>

                {/* Clients */}
                <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center">
                    <Users className="w-4 h-4 text-purple-500 mb-1" />
                    <p className="font-bold text-gray-800">
                        {device.clients != null ? device.clients : '—'}
                    </p>
                    <p className="text-gray-400">Client</p>
                </div>

                {/* CPU */}
                {device.cpu != null && (
                    <div className="bg-gray-50 rounded-lg p-2 col-span-2">
                        <div className="flex justify-between mb-1">
                            <span className="flex items-center gap-1 text-gray-500"><Cpu className="w-3 h-3" /> CPU</span>
                            <span className="font-bold text-gray-800">{device.cpu}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full transition-all ${device.cpu > 80 ? 'bg-red-500' : device.cpu > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                style={{ width: `${device.cpu}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Uptime */}
                {device.uptime && (
                    <div className="bg-gray-50 rounded-lg p-2 col-span-2 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">Uptime:</span>
                        <span className="font-mono font-bold text-gray-700">{device.uptime}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Komponen Utama ────────────────────────────────────────────────────────────
const NetworkMonitoring = () => {
    const [activeTab, setActiveTab] = useState('traffic');

    const [nocData,      setNocData]      = useState(null);
    const [isDemoMode,   setIsDemoMode]   = useState(true);
    const [statusGateway, setStatusGateway] = useState('CONNECTING');

    // Rolling traffic history untuk chart
    const [trafficHistory, setTrafficHistory] = useState([]);

    const logEndRef = useRef(null);

    // State modal Auto-Ticket
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData,      setTicketData]      = useState({ title: '', desc: '', alarmType: 'general' });
    const [ticketStatus,    setTicketStatus]    = useState(null);

    // ── Fetch NOC data ──────────────────────────────────────────────────────
    const fetchNocData = useCallback(async () => {
        try {
            const res    = await api.get('/noc/stats');
            const result = res.data;

            if (result.success) {
                setNocData(result.data);
                setIsDemoMode(result.is_demo === true);
                setStatusGateway(result.is_demo ? 'DEMO' : 'ONLINE');

                // Tambahkan ke rolling history chart
                setTrafficHistory(prev => {
                    const next = [...prev, result.data.traffic ?? 0];
                    return next.slice(-CHART_MAX_POINTS);
                });
            } else {
                setStatusGateway('ERROR');
            }
        } catch (err) {
            console.error('Gagal fetch NOC:', err);
            setStatusGateway('OFFLINE');
        }
    }, []);

    useEffect(() => {
        fetchNocData();
        const id = setInterval(fetchNocData, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchNocData]);

    // Auto scroll syslog
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [nocData?.logs]);

    // ── Auto-Ticket ─────────────────────────────────────────────────────────
    const handleCreateTicket = (title, desc, alarmType = 'general') => {
        setTicketData({ title, desc, alarmType });
        setTicketStatus(null);
        setShowTicketModal(true);
    };

    const handleSubmitTicket = async () => {
        setTicketStatus('loading');
        const priorityMap = { los: 'urgent', link_down: 'high', cpu_high: 'high', general: 'medium' };
        const priority = priorityMap[ticketData.alarmType] || 'medium';

        try {
            await api.post('/tickets', {
                title:       ticketData.title,
                description: ticketData.desc,
                priority,
            });
            setTicketStatus('success');
            setTimeout(() => setShowTicketModal(false), 1500);
        } catch (err) {
            console.error(err);
            setTicketStatus('error');
        }
    };

    // ── Derived state ────────────────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-8 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex justify-between items-end mb-6 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Network Operations Center</h1>
                    <p className="text-gray-500 mt-1">Area Pusat Kendali Jaringan ISP (Enterprise Level)</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDemoMode ? (
                        <span className="flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300 animate-pulse">
                            <Zap className="w-3 h-3" /> DEMO MODE — Konfigurasi MikroTik di halaman Integrasi
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full border border-green-300">
                            <Radio className="w-3 h-3 animate-pulse" /> LIVE — Data Real-time MikroTik
                        </span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
                {[
                    { id: 'traffic', icon: <Activity className="w-4 h-4 mr-2" />, label: 'Traffic & Performa' },
                    { id: 'devices', icon: <Server className="w-4 h-4 mr-2" />, label: 'Manajemen Perangkat' },
                    { id: 'alarms',  icon: <AlertTriangle className="w-4 h-4 mr-2" />, label: 'Alarm & Insiden', badge: alarms.length },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? tab.id === 'alarms' ? 'bg-white shadow text-red-600' : 'bg-white shadow text-blue-600'
                                : 'text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
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

            {/* ── TAB 2: MANAJEMEN PERANGKAT ─────────────────────────────────────── */}
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



            {/* ── TAB 3: ALARM & INSIDEN (Dinamis dari backend) ────────────────── */}
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
                                    ticketData.alarmType === 'los'                                        ? 'bg-red-100 text-red-700' :
                                    ticketData.alarmType === 'cpu_high' || ticketData.alarmType === 'link_down' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {ticketData.alarmType === 'los'                                        ? '🔴 URGENT' :
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