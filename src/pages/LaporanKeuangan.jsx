import { TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';

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
        <div className="p-8 print:p-0">
            {/* Kop Surat Khusus Print */}
            <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">NETBILLING ISP</h1>
                        <p className="text-sm font-bold text-gray-600">Jl. Teknologi No. 45, Jember, Jawa Timur</p>
                        <p className="text-sm text-gray-500">Email: admin@netbilling.co.id | Telp: (0331) 123456</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-800 uppercase">Laporan Keuangan</p>
                        <p className="text-sm font-bold text-gray-600 mt-1">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
            </div>

            <div className="mb-8 border-b border-gray-300 pb-4 print:hidden">
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Tren Pendapatan (6 Bulan Terakhir)</h3>
                        <button 
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm flex items-center transition print:hidden"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download PDF
                        </button>
                    </div>
                    
                    {/* Visualisasi Bar Chart Sederhana */}
                    <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-4 pt-4 border-t border-gray-100">
                        {[
                            { month: 'Nov', val: 40, label: '35Jt' },
                            { month: 'Des', val: 55, label: '38Jt' },
                            { month: 'Jan', val: 50, label: '36Jt' },
                            { month: 'Feb', val: 65, label: '41Jt' },
                            { month: 'Mar', val: 80, label: '44Jt' },
                            { month: 'Apr', val: 100, label: '45Jt' }
                        ].map((data, idx) => (
                            <div key={idx} className="flex flex-col items-center flex-1 group">
                                <div className="w-full relative flex justify-center items-end h-40">
                                    <div 
                                        className="w-full max-w-[40px] bg-gradient-to-t from-blue-400 to-blue-600 rounded-t-md transition-all duration-500 group-hover:from-blue-500 group-hover:to-blue-700 shadow-sm" 
                                        style={{ height: `${data.val}%` }}
                                    ></div>
                                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded shadow-sm">
                                        Rp {data.label}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-bold mt-3 uppercase tracking-wider">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaporanKeuangan;
