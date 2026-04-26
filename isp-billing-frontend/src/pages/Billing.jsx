import { useState, useEffect } from 'react';
import { DollarSign, FileText, X, CheckCircle, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Tunai');

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/invoices');
            setInvoices(response.data);
        } catch (err) {
            console.error('Gagal mengambil tagihan:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const getStatusColor = (status) => {
        if (status === 'paid') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'cancelled') return 'bg-gray-100 text-gray-800 border-gray-200';
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    const getStatusLabel = (status) => {
        if (status === 'paid') return 'Lunas';
        if (status === 'unpaid') return 'Belum Bayar';
        return 'Dibatalkan';
    };

    const handleGenerateInvoices = async () => {
        if (!window.confirm('Generate tagihan untuk semua pelanggan aktif bulan ini?')) return;
        
        try {
            setGenerating(true);
            const response = await api.post('/invoices/generate');
            alert(response.data.message);
            fetchInvoices();
        } catch (err) {
            alert('Gagal generate tagihan');
        } finally {
            setGenerating(false);
        }
    };

    // Buka modal verifikasi
    const openPaymentModal = (inv) => {
        setSelectedInvoice(inv);
        setShowPaymentModal(true);
    };

    // Fungsi konfirmasi pelunasan
    const handleConfirmPayment = async () => {
        try {
            await api.put(`/invoices/${selectedInvoice.id}`, { 
                status: 'paid',
                notes: `Dibayar via ${paymentMethod}`
            });
            alert(`Tagihan berhasil dilunasi via ${paymentMethod}!`);
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            fetchInvoices();
        } catch (err) {
            alert('Gagal memverifikasi pembayaran');
        }
    };

    const handleSendReceipt = (id) => {
        alert(`Kwitansi digital untuk tagihan ${id} sedang dikirim ke WhatsApp pelanggan...`);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Billing & Tagihan</h1>
                    <p className="text-gray-500">Kelola invoice dan verifikasi pembayaran pelanggan.</p>
                </div>
                <button 
                    onClick={handleGenerateInvoices}
                    disabled={generating}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all font-bold flex items-center disabled:opacity-50"
                >
                    {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
                    Generate Tagihan Bulan Ini
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No. Invoice</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Periode</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Memuat data...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">Belum ada tagihan yang dibuat.</td></tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">#INV-{inv.id.toString().padStart(4, '0')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{inv.customer?.name}</span>
                                            <span className="text-xs text-gray-500">{inv.package?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">Bulan {inv.month}/{inv.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">Rp {Number(inv.amount).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(inv.status)}`}>
                                            {getStatusLabel(inv.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium flex justify-center gap-2">
                                        {inv.status === 'unpaid' && (
                                            <button 
                                                onClick={() => openPaymentModal(inv)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs transition-all font-bold flex items-center shadow-lg shadow-blue-500/20"
                                            >
                                                <DollarSign className="w-3.5 h-3.5 mr-1" /> Verifikasi Bayar
                                            </button>
                                        )}
                                        {inv.status === 'paid' && (
                                            <button 
                                                onClick={() => handleSendReceipt(inv.id)}
                                                className="text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-lg text-xs transition-all flex items-center font-bold"
                                            >
                                                <FileText className="w-3.5 h-3.5 mr-1" /> Kwitansi WA
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Verifikasi Pembayaran */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Verifikasi Pembayaran
                            </h3>
                            <button onClick={() => setShowPaymentModal(false)} className="hover:bg-blue-700 p-1 rounded transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="mb-4 bg-gray-50 p-3 rounded-lg border">
                                <p className="text-sm text-gray-500">Tagihan:</p>
                                <p className="font-bold text-lg">{selectedInvoice.id} - {selectedInvoice.name}</p>
                                <p className="text-xl text-blue-600 font-bold mt-1">Rp {selectedInvoice.amount.toLocaleString('id-ID')}</p>
                            </div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Metode Pembayaran</label>
                            <div className="relative mb-4">
                                <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm cursor-pointer transition-all font-medium text-gray-700"
                                >
                                    <option value="Tunai">Tunai / Cash (Di Kantor)</option>
                                    <option value="Transfer BCA">Transfer Bank (BCA)</option>
                                    <option value="Transfer Mandiri">Transfer Bank (Mandiri)</option>
                                    <option value="GoPay">E-Wallet (GoPay)</option>
                                    <option value="OVO">E-Wallet (OVO)</option>
                                </select>
                                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs border border-yellow-200 mb-4">
                                <strong>Perhatian:</strong> Memverifikasi pembayaran akan otomatis mengirimkan Kwitansi Digital ke WhatsApp pelanggan.
                            </div>

                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleConfirmPayment}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
                                >
                                    Konfirmasi Lunas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;