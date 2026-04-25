import { useState } from 'react';
import { Database, Shield, Server, Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const MikrotikSettings = () => {
    // State untuk form pengaturan FreeRADIUS & CoA
    const [config, setConfig] = useState({
        // Database FreeRADIUS (MySQL/MariaDB)
        dbHost: '127.0.0.1',
        dbPort: '3306',
        dbUser: 'radius_user',
        dbPass: '',
        dbName: 'radius',
        
        // NAS (Mikrotik) & Radius Secret
        nasIp: '192.168.1.1',
        radiusSecret: 'rahasia123',
        coaPort: '3799', // Port standar untuk Disconnect Message (DM)
    });

    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleTestConnection = (e) => {
        e.preventDefault();
        setIsTesting(true);
        setTestResult(null);

        // Simulasi loading ping ke MySQL FreeRADIUS
        setTimeout(() => {
            setIsTesting(false);
            if (config.dbUser && config.dbName) {
                setTestResult('success');
            } else {
                setTestResult('error');
            }
        }, 1500);
    };

    const handleSave = () => {
        alert("Konfigurasi FreeRADIUS & NAS berhasil disimpan!");
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
            <div className="mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Database className="w-8 h-8 mr-3 text-blue-600" /> 
                    Integrasi FreeRADIUS & NAS
                </h1>
                <p className="text-gray-500 mt-2">Konfigurasi Database RADIUS Ubuntu dan Change of Authorization (CoA) Mikrotik.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* KOLOM KIRI: FORM INPUT */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Panel 1: Database FreeRADIUS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
                            <Database className="w-5 h-5 mr-2 text-blue-500" />
                            <h2 className="font-bold text-gray-700">Koneksi Database FreeRADIUS (MySQL/MariaDB)</h2>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Database Host</label>
                                <input type="text" value={config.dbHost} onChange={e => setConfig({...config, dbHost: e.target.value})} className="w-full p-2.5 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="127.0.0.1" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Database Port</label>
                                <input type="text" value={config.dbPort} onChange={e => setConfig({...config, dbPort: e.target.value})} className="w-full p-2.5 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="3306" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Database Name</label>
                                <input type="text" value={config.dbName} onChange={e => setConfig({...config, dbName: e.target.value})} className="w-full p-2.5 border rounded focus:ring-2 focus:ring-blue-500 text-sm" placeholder="radius" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">DB Username</label>
                                <input type="text" value={config.dbUser} onChange={e => setConfig({...config, dbUser: e.target.value})} className="w-full p-2.5 border rounded focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">DB Password</label>
                                <input type="password" value={config.dbPass} onChange={e => setConfig({...config, dbPass: e.target.value})} className="w-full p-2.5 border rounded focus:ring-2 focus:ring-blue-500 text-sm" placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    {/* Panel 2: NAS & CoA Pengaturan */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-purple-500" />
                            <h2 className="font-bold text-gray-700">Pengaturan NAS (Mikrotik) & Packet CoA</h2>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2 text-sm text-gray-600 bg-purple-50 p-3 rounded border border-purple-100 mb-2">
                                Info: Packet CoA (Change of Authorization) digunakan untuk memutus koneksi PPPoE/Hotspot pelanggan (Disconnect Message) saat status mereka berubah menjadi "Isolir" tanpa perlu login ke API.
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">NAS IP Address (Mikrotik)</label>
                                <input type="text" value={config.nasIp} onChange={e => setConfig({...config, nasIp: e.target.value})} className="w-full p-2.5 border rounded focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder="192.168.x.x" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Port CoA (Default: 3799)</label>
                                <input type="text" value={config.coaPort} onChange={e => setConfig({...config, coaPort: e.target.value})} className="w-full p-2.5 border rounded focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">RADIUS Secret</label>
                                <input type="password" value={config.radiusSecret} onChange={e => setConfig({...config, radiusSecret: e.target.value})} className="w-full p-2.5 border rounded focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                            </div>
                        </div>
                    </div>
                    
                </div>

                {/* KOLOM KANAN: ACTION & STATUS */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Status & Eksekusi</h3>
                        
                        {/* Tombol Test Koneksi Database */}
                        <button 
                            onClick={handleTestConnection}
                            disabled={isTesting}
                            className="w-full mb-4 flex justify-center items-center py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold transition disabled:opacity-50"
                        >
                            {isTesting ? (
                                <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Menghubungi MySQL...</>
                            ) : (
                                <><Database className="w-5 h-5 mr-2" /> Test Koneksi MySQL</>
                            )}
                        </button>

                        {/* Hasil Test */}
                        {testResult === 'success' && (
                            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-green-800">Koneksi Database Berhasil!</p>
                                    <p className="text-xs text-green-600 mt-1">Sistem siap melakukan sinkronisasi tabel radcheck dan radreply.</p>
                                </div>
                            </div>
                        )}
                        {testResult === 'error' && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-800">Koneksi Database Gagal</p>
                                    <p className="text-xs text-red-600 mt-1">Pastikan Host, Port, User, dan Password MySQL Ubuntu Anda sudah benar.</p>
                                </div>
                            </div>
                        )}

                        <hr className="my-4 border-gray-200" />

                        {/* Tombol Simpan */}
                        <button 
                            onClick={handleSave}
                            className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition"
                        >
                            <Save className="w-5 h-5 mr-2" /> Simpan Konfigurasi
                        </button>
                    </div>

                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center"><Server className="w-4 h-4 mr-1"/> Setup CoA di Mikrotik</h4>
                        <p className="text-xs text-blue-700 mb-2">Agar Mikrotik bisa menerima perintah putus dari Ubuntu:</p>
                        <ol className="list-decimal list-inside text-xs text-blue-700 space-y-1">
                            <li>Buka Winbox &gt; Menu <strong>Radius</strong>.</li>
                            <li>Klik tombol <strong>Incoming</strong>.</li>
                            <li>Centang <strong>Accept</strong>.</li>
                            <li>Isi Port dengan <strong>3799</strong>.</li>
                        </ol>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MikrotikSettings;