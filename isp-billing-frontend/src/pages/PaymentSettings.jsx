import { useState, useEffect } from 'react';
import api from '../api';
import { 
    CreditCard, Shield, Save, RefreshCw, 
    CheckCircle, XCircle, AlertTriangle, HelpCircle, 
    Copy, Check
} from 'lucide-react';

const PaymentSettings = () => {
    const [settings, setSettings] = useState({
        xendit_secret_key: '',
        xendit_webhook_token: '',
        xendit_sandbox: 'true',
        xendit_payment_methods: []
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Webhook URL generator
    const webhookUrl = `${window.location.origin.replace('5173', '8000')}/api/xendit/webhook`;

    const availableMethods = [
        { id: 'BCA', name: 'BCA Virtual Account' },
        { id: 'BNI', name: 'BNI Virtual Account' },
        { id: 'BRI', name: 'BRI Virtual Account' },
        { id: 'MANDIRI', name: 'Mandiri Virtual Account' },
        { id: 'PERMATA', name: 'Permata Virtual Account' },
        { id: 'QRIS', name: 'QRIS (Gopay, ShopeePay, LinkAja, dll)' },
        { id: 'OVO', name: 'OVO' },
        { id: 'DANA', name: 'DANA' },
        { id: 'SHOPEEPAY', name: 'ShopeePay (Direct)' },
        { id: 'ALFAMART', name: 'Alfamart' },
        { id: 'INDOMARET', name: 'Indomaret' }
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/pengaturan-jaringan');
                const data = res.data;
                
                // Parse payment methods
                let methods = [];
                if (data.xendit_payment_methods) {
                    try {
                        methods = JSON.parse(data.xendit_payment_methods);
                        if (!Array.isArray(methods)) methods = [];
                    } catch (e) {
                        methods = [];
                    }
                }

                setSettings({
                    xendit_secret_key: data.xendit_secret_key || '',
                    xendit_webhook_token: data.xendit_webhook_token || '',
                    xendit_sandbox: data.xendit_sandbox !== undefined ? String(data.xendit_sandbox) : 'true',
                    xendit_payment_methods: methods
                });
            } catch (error) {
                console.error('Gagal memuat pengaturan:', error);
                setMessage({ type: 'error', text: 'Gagal memuat pengaturan dari server.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCheckboxChange = (methodId) => {
        setSettings(prev => {
            const current = [...prev.xendit_payment_methods];
            const index = current.indexOf(methodId);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(methodId);
            }
            return { ...prev, xendit_payment_methods: current };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Kita parse data menjadi format key-value string
            const payload = {
                xendit_secret_key: settings.xendit_secret_key,
                xendit_webhook_token: settings.xendit_webhook_token,
                xendit_sandbox: settings.xendit_sandbox,
                xendit_payment_methods: JSON.stringify(settings.xendit_payment_methods)
            };

            const res = await api.post('/pengaturan-jaringan', payload);
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Pengaturan Xendit berhasil disimpan!' });
            } else {
                setMessage({ type: 'error', text: res.data.message || 'Gagal menyimpan pengaturan.' });
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Terjadi kesalahan koneksi.' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fadeIn bg-gray-50 min-h-screen">
            
            {/* Header */}
            <div className="mb-8 border-b border-gray-300 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
                        Pengaturan Payment Gateway Xendit
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Kelola kunci API, token webhook, dan metode pembayaran aktif untuk penagihan otomatis.
                    </p>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2 shrink-0" /> : <XCircle className="w-5 h-5 mr-2 shrink-0" />}
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Kolom Kiri: Form Config */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-blue-600" />
                            <h2 className="font-bold text-blue-900">Kredensial API Xendit</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Toggle Sandbox / Production */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Mode Environment
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer font-bold transition ${
                                        settings.xendit_sandbox === 'true' 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="xendit_sandbox" 
                                            value="true" 
                                            checked={settings.xendit_sandbox === 'true'} 
                                            onChange={() => setSettings({...settings, xendit_sandbox: 'true'})}
                                            className="sr-only" 
                                        />
                                        Sandbox (Uji Coba)
                                    </label>
                                    <label className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer font-bold transition ${
                                        settings.xendit_sandbox === 'false' 
                                            ? 'bg-red-50 border-red-500 text-red-700' 
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="xendit_sandbox" 
                                            value="false" 
                                            checked={settings.xendit_sandbox === 'false'} 
                                            onChange={() => setSettings({...settings, xendit_sandbox: 'false'})}
                                            className="sr-only" 
                                        />
                                        Production (Live)
                                    </label>
                                </div>
                            </div>

                            {/* Xendit Secret Key */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Secret Key
                                </label>
                                <input
                                    type="password"
                                    value={settings.xendit_secret_key}
                                    onChange={e => setSettings({ ...settings, xendit_secret_key: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder={settings.xendit_sandbox === 'true' ? 'xnd_development_...' : 'xnd_production_...'}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Kunci rahasia dari Dashboard Xendit Anda. Harap berhati-hati, jangan sebarkan kunci ini.
                                </p>
                            </div>

                            {/* Xendit Webhook Token */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Verification Token (Webhook Token)
                                </label>
                                <input
                                    type="password"
                                    value={settings.xendit_webhook_token}
                                    onChange={e => setSettings({ ...settings, xendit_webhook_token: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="Callback Token Xendit"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Token verifikasi callback yang dikirim oleh Xendit untuk memvalidasi request webhook.
                                </p>
                            </div>

                            {/* Metode Pembayaran */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Metode Pembayaran Aktif
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {availableMethods.map(method => {
                                        const isChecked = settings.xendit_payment_methods.includes(method.id);
                                        return (
                                            <label key={method.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-300 cursor-pointer shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleCheckboxChange(method.id)}
                                                    className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-semibold text-gray-700">{method.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Pilih metode pembayaran yang akan ditampilkan pada Invoice pelanggan. Pastikan metode ini sudah diaktifkan di dashboard Xendit Anda.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex justify-center items-center transition disabled:opacity-50 shadow-md"
                            >
                                {isSaving
                                    ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    : <Save className="w-5 h-5 mr-2" />}
                                Simpan Kredensial Xendit
                            </button>
                        </div>
                    </form>
                </div>

                {/* Kolom Kanan: Panduan Webhook */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center text-amber-600">
                            <AlertTriangle className="w-6 h-6 mr-2" />
                            <h3 className="font-bold text-gray-800">Panduan Webhook</h3>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                            Agar status pembayaran pelanggan terupdate otomatis (dan koneksi terisolir otomatis aktif kembali), Anda wajib mengatur webhook di Dashboard Xendit.
                        </p>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Callback URL / Webhook URL:
                            </label>
                            <div className="flex items-center border rounded-lg bg-gray-50 overflow-hidden">
                                <span className="flex-1 p-2 text-xs font-mono truncate text-gray-600">
                                    {webhookUrl}
                                </span>
                                <button
                                    onClick={handleCopyWebhook}
                                    className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <h4 className="font-bold text-sm text-gray-700 flex items-center">
                                <HelpCircle className="w-4 h-4 mr-1 text-gray-400" />
                                Langkah Pengaturan:
                            </h4>
                            <ol className="text-xs text-gray-500 list-decimal list-inside space-y-2 leading-relaxed">
                                <li>Masuk ke Dashboard Xendit.</li>
                                <li>Pilih menu <strong>Settings</strong> &gt; <strong>Callbacks</strong>.</li>
                                <li>Cari bagian <strong>Invoices</strong> &gt; <strong>Invoice paid</strong>.</li>
                                <li>Tempel Callback URL di atas.</li>
                                <li>Klik <strong>Test & Save</strong>.</li>
                                <li>Salin <strong>Verification Token</strong> Xendit dan tempel di form sebelah kiri.</li>
                            </ol>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentSettings;
