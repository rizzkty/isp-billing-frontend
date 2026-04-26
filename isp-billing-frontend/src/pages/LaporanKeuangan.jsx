import { useState, useEffect } from 'react';
import api from '../api';
import { TrendingUp, DollarSign, FileText, Users, Loader2, Award } from 'lucide-react';

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const LaporanKeuangan = () => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports')
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Memuat laporan keuangan...</p>
            </div>
        </div>
    );

    const { summary, months, top_customers } = data || {};
    const maxTotal = Math.max(...(months || []).map(m => m.total), 1);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800">Laporan Keuangan</h1>
                <p className="text-gray-500 mt-1">Rekap pendapatan dan piutang bisnis ISP Anda.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Pendapatan',  value: fmt(summary?.total_paid),   icon: DollarSign, color: 'text-green-600 bg-green-50 border-green-100' },
                    { label: 'Total Piutang',     value: fmt(summary?.total_unpaid),  icon: FileText,   color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
                    { label: 'Invoice Lunas',     value: summary?.paid_count ?? 0,    icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Invoice Belum Bayar', value: summary?.unpaid_count ?? 0, icon: Users,    color: 'text-red-600 bg-red-50 border-red-100' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${color}`}><Icon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                            <p className="text-xl font-black text-gray-800">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-black text-gray-800 mb-6">Pendapatan 12 Bulan Terakhir</h2>
                    <div className="flex items-end gap-2 h-48">
                        {(months || []).map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '160px' }}>
                                    <div className="w-full rounded-t-lg bg-green-400 transition-all duration-500"
                                        style={{ height: `${(m.paid / maxTotal) * 160}px` }} />
                                    <div className="w-full bg-yellow-300 transition-all duration-500"
                                        style={{ height: `${(m.unpaid / maxTotal) * 160}px` }} />
                                </div>
                                <span className="text-[9px] text-gray-400 font-medium text-center leading-tight">{m.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Lunas</span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-yellow-300 inline-block" /> Belum Bayar</span>
                    </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" /> Top Pelanggan
                    </h2>
                    <div className="space-y-3">
                        {(top_customers || []).length === 0 ? (
                            <p className="text-gray-400 italic text-sm">Belum ada data.</p>
                        ) : top_customers.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{c.name}</p>
                                    <p className="text-xs text-green-600 font-medium">{fmt(c.total_paid)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="font-black text-gray-800">Rekap Per Bulan</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Periode','Total Tagihan','Lunas','Belum Bayar','Persentase Bayar'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(months || []).slice().reverse().map((m, i) => {
                            const pct = m.total > 0 ? Math.round((m.paid / m.total) * 100) : 0;
                            return (
                                <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-3 font-bold text-gray-800 text-sm">{m.label}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{fmt(m.total)}</td>
                                    <td className="px-6 py-3 text-sm text-green-600 font-bold">{fmt(m.paid)}</td>
                                    <td className="px-6 py-3 text-sm text-yellow-600 font-bold">{fmt(m.unpaid)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 w-8">{pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LaporanKeuangan;
