import { useState } from 'react';

const Billing = () => {
    // Data tagihan pura-pura
    const [invoices, setInvoices] = useState([
        { id: 'INV-001', name: 'Budi Santoso', amount: 150000, dueDate: '2026-04-15', status: 'Lunas' },
        { id: 'INV-002', name: 'Siti Aminah', amount: 250000, dueDate: '2026-04-10', status: 'Terlambat' },
        { id: 'INV-003', name: 'Toko Makmur', amount: 500000, dueDate: '2026-04-25', status: 'Belum Bayar' },
    ]);

    const getStatusColor = (status) => {
        if (status === 'Lunas') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'Terlambat') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    // Fungsi simulasi pelunasan manual
    const handlePay = (id) => {
        setInvoices(invoices.map(inv => 
            inv.id === id ? { ...inv, status: 'Lunas' } : inv
        ));
        alert(`Tagihan ${id} berhasil dilunasi manual!`);
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                    {inv.status !== 'Lunas' && (
                                        <button 
                                            onClick={() => handlePay(inv.id)}
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs mr-2 transition"
                                        >
                                            Bayar
                                        </button>
                                    )}
                                    {inv.status === 'Terlambat' && (
                                        <button className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs transition">
                                            Isolir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Billing;