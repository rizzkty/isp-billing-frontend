import { useState } from 'react';
import { Router, Database, Shield, Save, RefreshCw, CheckCircle, XCircle, Activity, Server } from 'lucide-react';

const NetworkSettings = () => {
    // State gabungan untuk API MikroTik dan RADIUS
    const [config, setConfig] = useState({
        // 1. Mikrotik API Config
        apiIp: '192.168.1.1',
        apiPort: '8728',
        apiUser: 'admin',
        apiPass: '',
        
        // 2. FreeRADIUS DB Config
        dbHost: '127.0.0.1',
        dbPort: '3306',
        dbName: 'radius',
        dbUser: 'root',
        dbPass: '',
        
        // 3. NAS & CoA Config
        radiusSecret: 'NetBilling2026',
        coaPort: '3799'
    });

    // State untuk loading dan hasil test masing-masing
    const [statusApi, setStatusApi] = useState({ isTesting: false, result: null, message: '' });
    const [statusDb, setStatusDb] = useState({ isTesting: false, result: null, message: '' });

    // Handler Test Koneksi API MikroTik (Port 8728)
    const handleTestApi = async (e) => {
        e.preventDefault();
        setStatusApi({ isTesting: true, result: null, message: '' });
        
        try {
            const res = await fetch('http://localhost:8000/api/mikrotik/test-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                setStatusApi({ isTesting: false, result: 'success', message: `Terhubung ke: ${data.identity}` });
            } else {
                setStatusApi({ isTesting: false, result: 'error', message: data.message });
            }
        } catch (error) {
            setStatusApi({ isTesting: false, result: 'error', message: 'Gagal menghubungi server Laravel' });
        }
    };

    // Handler Test Koneksi Database RADIUS (Port 3306)
    const handleTestDb = async (e) => {
        e.preventDefault();
        setStatusDb({ isTesting: true, result: null, message: '' });

        try {
            const res = await fetch('http://localhost:8000/api/radius/test-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                setStatusDb({ isTesting: false, result: 'success', message: 'Koneksi MySQL Berhasil' });
            } else {
                setStatusDb({ isTesting: false, result: 'error', message: data.message });
            }
        } catch (error) {
            setStatusDb({ isTesting: false, result: 'error', message: 'Gagal menghubungi server Laravel' });
        }
    };

    const handleSaveAll = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify(config) // Kirim seluruh objek config ke Laravel
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                alert("Sukses! " + data.message);
            } else {
                alert("Gagal menyimpan pengaturan.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan jaringan saat menyimpan.");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn bg-gray-50 min-h-screen">
            <div className="mb-8 border-b border-gray-300 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Server className="w-8 h-8 mr-3 text-blue-600" /> 
                        Integrasi Sistem & Jaringan
                    </h1>
                    <p className="text-gray-500 mt-2">Pusat pengaturan komunikasi antara Aplikasi, MikroTik, dan Server RADIUS.</p>
                </div>
                <button 
                    onClick={handleSaveAll}
                    className="hidden md:flex items-center py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition"
                >
                    <Save className="w-5 h-5 mr-2" /> Simpan Pengaturan
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* BLOK 1: MIKROTIK API (MONITORING) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                            <div className="flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                                <h2 className="font-bold text-blue-900">Koneksi MikroTik API</h2>
                            </div>
                            <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-1 rounded">Port 8728</span>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">IP Address Router</label>
                                    <input type="text" value={config.apiIp} onChange={e => setConfig({...config, apiIp: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="192.168.x.x" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">API Port</label>
                                    <input type="text" value={config.apiPort} onChange={e => setConfig({...config, apiPort: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">API Username</label>
                                    <input type="text" value={config.apiUser} onChange={e => setConfig({...config, apiUser: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">API Password</label>
                                    <input type="password" value={config.apiPass} onChange={e => setConfig({...config, apiPass: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                            </div>

                            <button onClick={handleTestApi} disabled={statusApi.isTesting} className="w-full mt-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold flex justify-center items-center transition disabled:opacity-50">
                                {statusApi.isTesting ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Router className="w-5 h-5 mr-2" />}
                                Test Koneksi MikroTik
                            </button>

                            {statusApi.result === 'success' && <p className="text-sm text-green-600 font-bold flex items-center mt-2"><CheckCircle className="w-4 h-4 mr-1"/> {statusApi.message}</p>}
                            {statusApi.result === 'error' && <p className="text-sm text-red-600 font-bold flex items-center mt-2"><XCircle className="w-4 h-4 mr-1"/> {statusApi.message}</p>}
                        </div>
                    </div>
                </div>

                {/* BLOK 2: FREERADIUS & COA (BILLING) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                            <div className="flex items-center">
                                <Database className="w-5 h-5 mr-2 text-purple-600" />
                                <h2 className="font-bold text-purple-900">Database RADIUS & CoA</h2>
                            </div>
                            <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-1 rounded">Port 3306 & 3799</span>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Database Host</label>
                                    <input type="text" value={config.dbHost} onChange={e => setConfig({...config, dbHost: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Database Name</label>
                                    <input type="text" value={config.dbName} onChange={e => setConfig({...config, dbName: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">DB Username</label>
                                    <input type="text" value={config.dbUser} onChange={e => setConfig({...config, dbUser: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">DB Password</label>
                                    <input type="password" value={config.dbPass} onChange={e => setConfig({...config, dbPass: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                            </div>

                            <hr className="border-gray-100 my-4" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Radius Secret</label>
                                    <input type="password" value={config.radiusSecret} onChange={e => setConfig({...config, radiusSecret: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">CoA Port (Disconnect)</label>
                                    <input type="text" value={config.coaPort} onChange={e => setConfig({...config, coaPort: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                                </div>
                            </div>

                            <button onClick={handleTestDb} disabled={statusDb.isTesting} className="w-full mt-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold flex justify-center items-center transition disabled:opacity-50">
                                {statusDb.isTesting ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Database className="w-5 h-5 mr-2" />}
                                Test Koneksi MySQL Radius
                            </button>

                            {statusDb.result === 'success' && <p className="text-sm text-green-600 font-bold flex items-center mt-2"><CheckCircle className="w-4 h-4 mr-1"/> {statusDb.message}</p>}
                            {statusDb.result === 'error' && <p className="text-sm text-red-600 font-bold flex items-center mt-2"><XCircle className="w-4 h-4 mr-1"/> {statusDb.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Tombol Simpan Mobile */}
                <button 
                    onClick={handleSaveAll}
                    className="md:hidden w-full flex justify-center items-center py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition"
                >
                    <Save className="w-5 h-5 mr-2" /> Simpan Pengaturan
                </button>

            </div>
        </div>
    );
};

export default NetworkSettings;