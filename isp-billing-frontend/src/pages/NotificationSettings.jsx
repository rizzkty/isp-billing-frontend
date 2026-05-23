import { useState, useEffect } from 'react';
import api from '../api';
import { 
    Bell, Send, Mail, Phone, ShieldCheck, Save, RefreshCw, 
    CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Lock, Globe, FileText
} from 'lucide-react';

const NotificationSettings = () => {
    const [settings, setSettings] = useState({
        waProvider: 'fonnte',
        waApiKey: '',
        waBaseUrl: 'https://api.fonnte.com/send',
        waMetaAccessToken: '',
        waMetaPhoneId: '',
        waMetaTemplateName: 'general_notification',
        mailDriver: 'log',
        mailHost: '127.0.0.1',
        mailPort: '2525',
        mailUsername: '',
        mailPassword: '',
        mailEncryption: 'tls',
        mailFromAddress: 'hello@example.com',
        mailFromName: 'NetBilling ISP'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showMetaToken, setShowMetaToken] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // State untuk testing WA
    const [testWa, setTestWa] = useState({ phone: '', message: 'NetBilling ISP: Ini adalah pesan uji coba integrasi WhatsApp.' });
    const [isTestingWa, setIsTestingWa] = useState(false);
    const [waTestResult, setWaTestResult] = useState({ type: '', text: '' });

    // State untuk testing Email
    const [testEmail, setTestEmail] = useState({ email: '', subject: 'Uji Coba Email NetBilling ISP', message: 'Ini adalah email uji coba untuk memverifikasi konfigurasi SMTP mail server Anda.' });
    const [isTestingEmail, setIsTestingEmail] = useState(false);
    const [emailTestResult, setEmailTestResult] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/pengaturan-jaringan');
                const data = res.data;
                
                setSettings(prev => ({
                    ...prev,
                    waProvider: data.waProvider || 'fonnte',
                    waApiKey: data.waApiKey || '',
                    waBaseUrl: data.waBaseUrl || 'https://api.fonnte.com/send',
                    waMetaAccessToken: data.waMetaAccessToken || '',
                    waMetaPhoneId: data.waMetaPhoneId || '',
                    waMetaTemplateName: data.waMetaTemplateName || 'general_notification',
                    mailDriver: data.mailDriver || 'log',
                    mailHost: data.mailHost || '127.0.0.1',
                    mailPort: data.mailPort || '2525',
                    mailUsername: data.mailUsername || '',
                    mailPassword: data.mailPassword || '',
                    mailEncryption: data.mailEncryption || 'tls',
                    mailFromAddress: data.mailFromAddress || 'hello@example.com',
                    mailFromName: data.mailFromName || 'NetBilling ISP'
                }));
            } catch (error) {
                console.error('Gagal memuat pengaturan:', error);
                setMessage({ type: 'error', text: 'Gagal memuat pengaturan dari server.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('/pengaturan-jaringan', settings);
            setMessage({ type: 'success', text: 'Konfigurasi notifikasi berhasil disimpan!' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Gagal menyimpan pengaturan:', error);
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan. Silakan coba lagi.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestWa = async (e) => {
        e.preventDefault();
        if (!testWa.phone) {
            setWaTestResult({ type: 'error', text: 'Masukkan nomor tujuan WhatsApp!' });
            return;
        }
        setIsTestingWa(true);
        setWaTestResult({ type: '', text: '' });

        try {
            await api.post('/settings/test-wa', testWa);
            setWaTestResult({ type: 'success', text: 'WhatsApp uji coba berhasil dikirim! Silakan periksa nomor tujuan Anda.' });
        } catch (error) {
            console.error('Gagal uji coba WhatsApp:', error);
            setWaTestResult({ 
                type: 'error', 
                text: error.response?.data?.message || 'Gagal mengirim WhatsApp uji coba. Pastikan kredensial provider aktif.' 
            });
        } finally {
            setIsTestingWa(false);
        }
    };

    const handleTestEmail = async (e) => {
        e.preventDefault();
        if (!testEmail.email) {
            setEmailTestResult({ type: 'error', text: 'Masukkan alamat email tujuan!' });
            return;
        }
        setIsTestingEmail(true);
        setEmailTestResult({ type: '', text: '' });

        try {
            await api.post('/settings/test-email', testEmail);
            setEmailTestResult({ type: 'success', text: 'Email uji coba berhasil dikirim! Silakan periksa inbox tujuan Anda.' });
        } catch (error) {
            console.error('Gagal uji coba email:', error);
            setEmailTestResult({ 
                type: 'error', 
                text: error.response?.data?.message || 'Gagal mengirim email uji coba. Periksa konfigurasi SMTP Anda.' 
            });
        } finally {
            setIsTestingEmail(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500 font-bold">Memuat konfigurasi...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                    <Bell className="w-8 h-8 text-blue-600" />
                    Pengaturan Notifikasi
                </h1>
                <p className="text-gray-500 mt-1">Kelola kredensial API WhatsApp Gateway (Fonnte/Meta) dan Server SMTP Email untuk broadcast & billing otomatis.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                    <span className="font-bold text-sm">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CARD 1: WHATSAPP */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex items-center gap-3 text-white">
                                <Phone className="w-6 h-6" />
                                <div>
                                    <h2 className="font-black text-lg">WhatsApp Gateway</h2>
                                    <p className="text-emerald-100 text-xs font-semibold">Tentukan gateway pengiriman notifikasi/broadcast WhatsApp pelanggan.</p>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp Provider</label>
                                    <select 
                                        name="waProvider" 
                                        value={settings.waProvider} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="fonnte">Fonnte (Gateway Emulasi)</option>
                                        <option value="meta">WhatsApp Cloud API (Resmi Meta - Anti Ban)</option>
                                    </select>
                                </div>

                                {settings.waProvider === 'fonnte' ? (
                                    <>
                                        {/* FONNTE SETTINGS */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Fonnte API Key</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="waApiKey" 
                                                    value={settings.waApiKey} 
                                                    onChange={handleChange}
                                                    placeholder="Masukkan token Fonnte..."
                                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Base URL API</label>
                                            <input 
                                                type="url" 
                                                name="waBaseUrl" 
                                                value={settings.waBaseUrl} 
                                                onChange={handleChange}
                                                placeholder="https://api.fonnte.com/send"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* META SETTINGS */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Meta Access Token (System User)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type={showMetaToken ? 'text' : 'password'} 
                                                    name="waMetaAccessToken" 
                                                    value={settings.waMetaAccessToken} 
                                                    onChange={handleChange}
                                                    placeholder="EAABw..."
                                                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowMetaToken(!showMetaToken)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number ID</label>
                                                <input 
                                                    type="text" 
                                                    name="waMetaPhoneId" 
                                                    value={settings.waMetaPhoneId} 
                                                    onChange={handleChange}
                                                    placeholder="e.g. 1092839281928"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Template Name (Anti-Ban)</label>
                                                <input 
                                                    type="text" 
                                                    name="waMetaTemplateName" 
                                                    value={settings.waMetaTemplateName} 
                                                    onChange={handleChange}
                                                    placeholder="general_notification"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1.5">
                                            <p className="font-bold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Catatan WhatsApp Cloud API Resmi:</p>
                                            <p>1. Daftarkan template di Dashboard Meta Developers dengan 1 parameter body: `{"{{1}}"}` agar bisa mengirim teks bebas.</p>
                                            <p>2. Kosongkan "Template Name" jika hanya ingin berkirim pesan teks biasa (hanya berfungsi jika sesi obrolan 24 jam dengan pelanggan sedang aktif).</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* SUB SECTION: TEST WHATSAPP */}
                        <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                            <div className="flex items-center gap-2 mb-3 text-emerald-800">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-wider">Konektivitas Uji Coba</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="No. WA Tujuan (e.g. 08123456789)" 
                                        value={testWa.phone}
                                        onChange={e => setTestWa(prev => ({ ...prev, phone: e.target.value }))}
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleTestWa} 
                                        disabled={isTestingWa}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isTestingWa ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                        Tes Kirim WA
                                    </button>
                                </div>

                                {waTestResult.text && (
                                    <div className={`p-2.5 rounded-lg border text-xs flex gap-2 ${
                                        waTestResult.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                                    }`}>
                                        {waTestResult.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                                        <span>{waTestResult.text}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: SMTP EMAIL */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex items-center gap-3 text-white">
                                <Mail className="w-6 h-6" />
                                <div>
                                    <h2 className="font-black text-lg">Server SMTP Email</h2>
                                    <p className="text-blue-100 text-xs font-semibold">Menggunakan SMTP untuk mengirimkan tagihan PDF / kuitansi lunas ke pelanggan.</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Mailer Driver</label>
                                        <select 
                                            name="mailDriver" 
                                            value={settings.mailDriver} 
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="smtp">SMTP (Real Mailer)</option>
                                            <option value="log">Log (Simulated Mailer)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Encryption</label>
                                        <select 
                                            name="mailEncryption" 
                                            value={settings.mailEncryption} 
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="none">None (Plaintext)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">SMTP Host</label>
                                        <input 
                                            type="text" 
                                            name="mailHost" 
                                            value={settings.mailHost} 
                                            onChange={handleChange}
                                            placeholder="smtp.mailtrap.io"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">SMTP Port</label>
                                        <input 
                                            type="text" 
                                            name="mailPort" 
                                            value={settings.mailPort} 
                                            onChange={handleChange}
                                            placeholder="2525"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Username</label>
                                        <input 
                                            type="text" 
                                            name="mailUsername" 
                                            value={settings.mailUsername} 
                                            onChange={handleChange}
                                            placeholder="user@domain.com"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? 'text' : 'password'} 
                                                name="mailPassword" 
                                                value={settings.mailPassword} 
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Sender Email Address</label>
                                        <input 
                                            type="email" 
                                            name="mailFromAddress" 
                                            value={settings.mailFromAddress} 
                                            onChange={handleChange}
                                            placeholder="billing@netbilling.id"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Sender Name</label>
                                        <input 
                                            type="text" 
                                            name="mailFromName" 
                                            value={settings.mailFromName} 
                                            onChange={handleChange}
                                            placeholder="NetBilling ISP"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SUB SECTION: TEST EMAIL */}
                        <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                            <div className="flex items-center gap-2 mb-3 text-indigo-800">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-wider">Konektivitas Uji Coba</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="email" 
                                        placeholder="Alamat Email Tujuan (e.g. user@email.com)" 
                                        value={testEmail.email}
                                        onChange={e => setTestEmail(prev => ({ ...prev, email: e.target.value }))}
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleTestEmail} 
                                        disabled={isTestingEmail}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isTestingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                        Tes Kirim Email
                                    </button>
                                </div>

                                {emailTestResult.text && (
                                    <div className={`p-2.5 rounded-lg border text-xs flex gap-2 ${
                                        emailTestResult.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                                    }`}>
                                        {emailTestResult.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                                        <span>{emailTestResult.text}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationSettings;
