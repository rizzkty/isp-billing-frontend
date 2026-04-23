import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const LaporanKeuangan = () => {
    // Data dummy untuk ringkasan laporan
    const summary = {
        pendapatanBulanIni: 45000000,
        piutangBelumDibayar: 12500000,
        pelangganBaru: 24,
        churn: 3,
    };

    const recentTransactions = [
        { id: 'INV-001', name: 'Budi Santoso', amount: 150000, date: '2026-04-15', method: 'Transfer BCA' },
        { id: 'INV-012', name: 'Warnet Laju', amount: 800000, date: '2026-04-14', method: 'Tunai' },
        { id: 'INV-045', name: 'Ahmad Faiz', amount: 200000, date: '2026-04-14', method: 'GoPay' },
    ];

    return (
        <div className="p-8">
            <div className="mb-8 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Laporan Keuangan & Analisis</h1>
                <p className="text-gray-500 mt-1">Rekapitulasi pendapatan, piutang, dan metrik pertumbuhan pelanggan.</p>
            </div>

            {/* Kartu Ringkasan (Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Pendapatan */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pendapatan Bulan Ini</h3>
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        Rp {summary.pendapatanBulanIni.toLocaleString('id-ID')}
                    </div>
                    <p className="text-sm text-green-600 font-bold mt-2">↑ 12% dari bulan lalu</p>
                </div>

                {/* Piutang */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Piutang</h3>
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        Rp {summary.piutangBelumDibayar.toLocaleString('id-ID')}
                    </div>
                    <p className="text-sm text-red-600 font-bold mt-2">Menunggu pembayaran</p>
                </div>

                {/* Pelanggan Baru */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pelanggan Baru</h3>
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {summary.pelangganBaru} <span className="text-lg font-normal text-gray-500">Koneksi</span>
                    </div>
                    <p className="text-sm text-blue-600 font-bold mt-2">Bulan ini</p>
                </div>

                {/* Churn (Berhenti Berlangganan) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Churn Rate</h3>
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {summary.churn} <span className="text-lg font-normal text-gray-500">Pelanggan Putus</span>
                    </div>
                    <p className="text-sm text-yellow-600 font-bold mt-2">Bulan ini</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tabel Transaksi Terakhir */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800">Transaksi Pembayaran Terakhir</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pelanggan</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metode</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentTransactions.map((trx) => (
                                <tr key={trx.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{trx.name}</div>
                                        <div className="text-xs text-gray-500">{trx.date}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                        + Rp {trx.amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs border">
                                            {trx.method}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Grafik / Area Konten Ekstra */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
                    <div className="text-gray-400 mb-4">
                        <TrendingUp className="w-16 h-16 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Grafik Pendapatan Bulanan</h3>
                    <p className="text-sm text-gray-500 max-w-sm">Area ini dipersiapkan untuk menampilkan grafik chart interaktif yang menghubungkan data pendapatan kotor vs pengeluaran operasional.</p>
                    <button className="mt-4 text-blue-600 font-bold hover:underline text-sm">Download Rekap Laporan PDF</button>
                </div>
            </div>
        </div>
    );
};

export default LaporanKeuangan;
