import { useState } from 'react';
import { DollarSign, FileText, X, CheckCircle, ChevronDown } from 'lucide-react';

const Billing = () => {
    // Data tagihan pura-pura
    const [invoices, setInvoices] = useState([
        { id: 'INV-001', name: 'Budi Santoso', amount: 150000, dueDate: '2026-04-15', status: 'Lunas', method: 'Transfer BCA' },
        { id: 'INV-002', name: 'Siti Aminah', amount: 250000, dueDate: '2026-04-10', status: 'Terlambat', method: null },
        { id: 'INV-003', name: 'Toko Makmur', amount: 500000, dueDate: '2026-04-25', status: 'Belum Bayar', method: null },
    ]);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Tunai');

    const getStatusColor = (status) => {
        if (status === 'Lunas') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'Terlambat') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    // Buka modal verifikasi
    const openPaymentModal = (inv) => {
        setSelectedInvoice(inv);
        setShowPaymentModal(true);
    };

    // Fungsi konfirmasi pelunasan
    const handleConfirmPayment = () => {
        setInvoices(invoices.map(inv => 
            inv.id === selectedInvoice.id ? { ...inv, status: 'Lunas', method: paymentMethod } : inv
        ));
        alert(`Tagihan ${selectedInvoice.id} berhasil dilunasi via ${paymentMethod}!\nKwitansi digital otomatis dikirim ke pelanggan.`);
        setShowPaymentModal(false);
        setSelectedInvoice(null);
    };

    const handleSendReceipt = (id) => {
        alert(`Kwitansi digital untuk tagihan ${id} sedang dikirim ke WhatsApp/Email pelanggan...`);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Billing & Tagihan</h1>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition">
                    Generate Tagihan Bulan Ini
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Tagihan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{inv.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.dueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">Rp {inv.amount.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(inv.status)}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium flex justify-center gap-2">
                                    {inv.status !== 'Lunas' && (
                                        <button 
                                            onClick={() => openPaymentModal(inv)}
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs transition flex items-center"
                                        >
                                            <DollarSign className="w-3 h-3 mr-1" /> Verifikasi Bayar
                                        </button>
                                    )}
                                    {inv.status === 'Lunas' && (
                                        <button 
                                            onClick={() => handleSendReceipt(inv.id)}
                                            className="text-green-700 bg-green-100 hover:bg-green-200 border border-green-300 px-3 py-1.5 rounded text-xs transition flex items-center font-bold"
                                        >
                                            <FileText className="w-3 h-3 mr-1" /> Kirim Kwitansi
                                        </button>
                                    )}
                                    {inv.status === 'Terlambat' && (
                                        <button className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs transition">
                                            Isolir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
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