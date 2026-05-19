import { useState, useEffect } from 'react';
import api from '../api';
import { 
    Router, Database, Shield, Save, RefreshCw, 
    CheckCircle, XCircle, Activity, Server, 
    PlayCircle, AlertTriangle, Wifi, List
} from 'lucide-react';

const NetworkSettings = () => {
    const [config, setConfig] = useState({
        // 1. MikroTik SNMP Config (ganti dari API)
        apiIp:         '192.168.1.1',
        snmpCommunity: 'public',
        isp1IfIndex:   '4',   // index interface ISP1
        isp2IfIndex:   '7',   // index interface ISP2

        // 2. FreeRADIUS DB Config (tidak berubah)
        dbHost:       '127.0.0.1',
        dbPort:       '3306',
        dbName:       'radius',
        dbUser:       'root',
        dbPass:       '',

        // 3. NAS & CoA Config (tidak berubah)
        radiusSecret: 'NetBilling2026',
        coaPort:      '3799',
    });

    const [statusSnmp,   setStatusSnmp]   = useState({ isTesting: false, result: null, message: '' });
    const [statusDb,     setStatusDb]     = useState({ isTesting: false, result: null, message: '' });
    const [statusIsolir, setStatusIsolir] = useState({ isRunning: false, result: null, message: '', log: '' });
    const [isSaving,     setIsSaving]     = useState(false);
    const [interfaces,   setInterfaces]   = useState([]);
    const [loadingIf,    setLoadingIf]    = useState(false);

    // Load settings saat buka halaman
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/pengaturan-jaringan');
                setConfig(prev => ({ ...prev, ...res.data }));
            } catch (error) {
                console.error('Gagal memuat pengaturan:', error);
            }
        };
        fetchSettings();
    }, []);

    // Test koneksi SNMP
    const handleTestSnmp = async (e) => {
        e.preventDefault();
        setStatusSnmp({ isTesting: true, result: null, message: '' });
        try {
            const res = await api.post('/snmp/test', {
                apiIp:         config.apiIp,
                snmpCommunity: config.snmpCommunity,
            });
            if (res.data.success) {
                setStatusSnmp({ isTesting: false, result: 'success', message: res.data.message });
            } else {
                setStatusSnmp({ isTesting: false, result: 'error', message: res.data.message });
            }
        } catch (error) {
            setStatusSnmp({
                isTesting: false,
                result:    'error',
                message:   error.response?.data?.message || 'Gagal menghubungi server',
            });
        }
    };

    // Muat daftar interface dari MikroTik via SNMP
    const handleLoadInterfaces = async () => {
        setLoadingIf(true);
        try {
            const res = await api.get('/snmp/interfaces');
            if (res.data.success) {
                setInterfaces(res.data.data);
            } else {
                alert('Gagal memuat interface: ' + res.data.message);
            }
        } catch (error) {
            alert('Gagal memuat interface: ' + (error.response?.data?.message || 'Kesalahan jaringan'));
        } finally {
            setLoadingIf(false);
        }
    };

    // Test koneksi DB RADIUS (tidak berubah)
    const handleTestDb = async (e) => {
        e.preventDefault();
        setStatusDb({ isTesting: true, result: null, message: '' });
        try {
            const res = await api.post('/radius/test-db', config);
            if (res.data.success) {
                setStatusDb({ isTesting: false, result: 'success', message: 'Koneksi MySQL Berhasil' });
            } else {
                setStatusDb({ isTesting: false, result: 'error', message: res.data.message });
            }
        } catch (error) {
            setStatusDb({
                isTesting: false,
                result:    'error',
                message:   error.response?.data?.message || 'Gagal menghubungi server',
            });
        }
    };

    // Simpan semua pengaturan
    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const res = await api.post('/pengaturan-jaringan', config);
            if (res.data.success) {
                alert('Sukses! ' + res.data.message);
            } else {
                alert('Gagal menyimpan pengaturan.');
            }
        } catch (error) {
            alert('Terjadi kesalahan: ' + (error.response?.data?.message || 'Kesalahan Jaringan'));
        } finally {
            setIsSaving(false);
        }
    };

    // Jalankan auto isolir (tidak berubah)
    const handleAutoIsolir = async () => {
        setStatusIsolir({ isRunning: true, result: null, message: '', log: '' });
        try {
            const res = await api.post('/isolir/run');
            if (res.data.success) {
                setStatusIsolir({ isRunning: false, result: 'success', message: res.data.message, log: res.data.log });
            } else {
                setStatusIsolir({ isRunning: false, result: 'error', message: res.data.message, log: '' });
            }
        } catch (error) {
            setStatusIsolir({
                isRunning: false,
                result:    'error',
                message:   error.response?.data?.message || 'Gagal menjalankan isolir',
                log:       '',
            });
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn bg-gray-50 min-h-screen">
            
            {/* Header */}
            <div className="mb-8 border-b border-gray-300 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Server className="w-8 h-8 mr-3 text-blue-600" />
                        Integrasi Sistem & Jaringan
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Pusat pengaturan komunikasi antara Aplikasi, MikroTik (SNMP), dan Server RADIUS.
                    </p>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="hidden md:flex items-center py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50"
                >
                    {isSaving
                        ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        : <Save className="w-5 h-5 mr-2" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── BLOK 1: MIKROTIK SNMP ─────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                            <div className="flex items-center">
                                <Wifi className="w-5 h-5 mr-2 text-blue-600" />
                                <h2 className="font-bold text-blue-900">Koneksi MikroTik SNMP</h2>
                            </div>
                            <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                Port 161 UDP
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* IP & Community */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        IP Address Router
                                    </label>
                                    <input
                                        type="text"
                                        value={config.apiIp}
                                        onChange={e => setConfig({ ...config, apiIp: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        placeholder="192.168.x.x"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        SNMP Community
                                    </label>
                                    <input
                                        type="text"
                                        value={config.snmpCommunity}
                                        onChange={e => setConfig({ ...config, snmpCommunity: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        placeholder="public"
                                    />
                                </div>
                            </div>

                            {/* Tombol Test SNMP */}
                            <button
                                onClick={handleTestSnmp}
                                disabled={statusSnmp.isTesting}
                                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold flex justify-center items-center transition disabled:opacity-50"
                            >
                                {statusSnmp.isTesting
                                    ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    : <Wifi className="w-5 h-5 mr-2" />}
                                Test Koneksi SNMP
                            </button>

                            {statusSnmp.result === 'success' && (
                                <p className="text-sm text-green-600 font-bold flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" /> {statusSnmp.message}
                                </p>
                            )}
                            {statusSnmp.result === 'error' && (
                                <p className="text-sm text-red-600 font-bold flex items-center">
                                    <XCircle className="w-4 h-4 mr-1" /> {statusSnmp.message}
                                </p>
                            )}

                            <hr className="border-gray-100" />

                            {/* Pilih Interface ISP */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">
                                        Pilih Interface ISP
                                    </label>
                                    <button
                                        onClick={handleLoadInterfaces}
                                        disabled={loadingIf}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50"
                                    >
                                        {loadingIf
                                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                                            : <List className="w-3 h-3" />}
                                        {loadingIf ? 'Memuat...' : 'Muat Interface'}
                                    </button>
                                </div>

                                {interfaces.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                ISP 1 (INET)
                                            </label>
                                            <select
                                                value={config.isp1IfIndex}
                                                onChange={e => setConfig({ ...config, isp1IfIndex: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                            >
                                                {interfaces.map(i => (
                                                    <option key={i.index} value={i.index}>
                                                        [{i.index}] {i.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                ISP 2 (Tsel)
                                            </label>
                                            <select
                                                value={config.isp2IfIndex}
                                                onChange={e => setConfig({ ...config, isp2IfIndex: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                            >
                                                {interfaces.map(i => (
                                                    <option key={i.index} value={i.index}>
                                                        [{i.index}] {i.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    /* Input manual kalau belum load interface */
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Index ISP 1 (manual)
                                            </label>
                                            <input
                                                type="number"
                                                value={config.isp1IfIndex}
                                                onChange={e => setConfig({ ...config, isp1IfIndex: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="4"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Index ISP 2 (manual)
                                            </label>
                                            <input
                                                type="number"
                                                value={config.isp2IfIndex}
                                                onChange={e => setConfig({ ...config, isp2IfIndex: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="7"
                                            />
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-400 mt-2">
                                    Klik "Muat Interface" untuk memilih dari daftar, atau isi index secara manual.
                                    Gunakan <code className="bg-gray-100 px-1 rounded">snmpwalk -v2c -c public {config.apiIp} 1.3.6.1.2.1.2.2.1.2</code> untuk cek index.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BLOK 2: FREERADIUS & COA (tidak berubah) ─────── */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                            <div className="flex items-center">
                                <Database className="w-5 h-5 mr-2 text-purple-600" />
                                <h2 className="font-bold text-purple-900">Database RADIUS & CoA</h2>
                            </div>
                            <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                Port 3306 & 3799
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Database Host</label>
                                    <input
                                        type="text"
                                        value={config.dbHost}
                                        onChange={e => setConfig({ ...config, dbHost: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Database Name</label>
                                    <input
                                        type="text"
                                        value={config.dbName}
                                        onChange={e => setConfig({ ...config, dbName: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">DB Username</label>
                                    <input
                                        type="text"
                                        value={config.dbUser}
                                        onChange={e => setConfig({ ...config, dbUser: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">DB Password</label>
                                    <input
                                        type="password"
                                        value={config.dbPass}
                                        onChange={e => setConfig({ ...config, dbPass: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-100 my-4" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Radius Secret</label>
                                    <input
                                        type="password"
                                        value={config.radiusSecret}
                                        onChange={e => setConfig({ ...config, radiusSecret: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">CoA Port (Disconnect)</label>
                                    <input
                                        type="text"
                                        value={config.coaPort}
                                        onChange={e => setConfig({ ...config, coaPort: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleTestDb}
                                disabled={statusDb.isTesting}
                                className="w-full mt-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold flex justify-center items-center transition disabled:opacity-50"
                            >
                                {statusDb.isTesting
                                    ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    : <Database className="w-5 h-5 mr-2" />}
                                Test Koneksi MySQL Radius
                            </button>

                            {statusDb.result === 'success' && (
                                <p className="text-sm text-green-600 font-bold flex items-center mt-2">
                                    <CheckCircle className="w-4 h-4 mr-1" /> {statusDb.message}
                                </p>
                            )}
                            {statusDb.result === 'error' && (
                                <p className="text-sm text-red-600 font-bold flex items-center mt-2">
                                    <XCircle className="w-4 h-4 mr-1" /> {statusDb.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── BLOK 3: OTOMASI ISOLIR (tidak berubah) ───────── */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                                <h2 className="font-bold text-red-900">Otomasi Isolir (Pemblokiran Klien Menunggak)</h2>
                            </div>
                            <span className="text-xs font-semibold bg-red-200 text-red-800 px-2 py-1 rounded">
                                Daily Cron: 00:01
                            </span>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Fitur ini akan mencari semua tagihan yang sudah lewat jatuh tempo (due_date) dan belum dibayar.
                                Pelanggan yang terkait akan diubah statusnya menjadi <strong>isolir</strong> dan IP-nya
                                dimasukkan ke dalam <strong>ISOLIR_LIST</strong> pada MikroTik.
                            </p>

                            <button
                                onClick={handleAutoIsolir}
                                disabled={statusIsolir.isRunning}
                                className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex justify-center items-center transition disabled:opacity-50 w-full md:w-auto"
                            >
                                {statusIsolir.isRunning
                                    ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    : <PlayCircle className="w-5 h-5 mr-2" />}
                                Jalankan Auto-Isolir Sekarang (Manual Trigger)
                            </button>

                            {statusIsolir.result === 'success' && (
                                <div className="mt-4 p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre">
                                    <div className="flex items-center text-green-500 mb-2 border-b border-gray-700 pb-2">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        <span className="font-bold">{statusIsolir.message}</span>
                                    </div>
                                    {statusIsolir.log}
                                </div>
                            )}
                            {statusIsolir.result === 'error' && (
                                <p className="text-sm text-red-600 font-bold flex items-center mt-4">
                                    <XCircle className="w-4 h-4 mr-1" /> {statusIsolir.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tombol Simpan Mobile */}
                <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="md:hidden w-full flex justify-center items-center py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50"
                >
                    {isSaving
                        ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        : <Save className="w-5 h-5 mr-2" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
        </div>
    );
};

export default NetworkSettings;