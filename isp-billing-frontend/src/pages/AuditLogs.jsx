import { useState } from 'react';

const AuditLogs = () => {
    // Simulasi data log dari database
    const [logs] = useState([
        { id: 1, time: '2026-04-20 10:15', user: 'admin_budi', role: 'Admin', action: 'CREATE_INVOICE', detail: 'Membuat tagihan INV-004 untuk Toko Makmur' },
        { id: 2, time: '2026-04-20 09:30', user: 'teknisi_anto', role: 'Teknisi', action: 'UPDATE_STATUS', detail: 'Mengubah status kabel area Jember Kota menjadi Perbaikan' },
        { id: 3, time: '2026-04-20 08:00', user: 'system_auto', role: 'System', action: 'AUTO_ISOLIR', detail: 'Sistem otomatis mengisolir pelanggan Siti Aminah (Telat 10 Hari)' },
        { id: 4, time: '2026-04-19 23:45', user: 'admin_budi', role: 'Admin', action: 'LOGIN', detail: 'Berhasil login ke sistem dari IP 114.120.x.x' },
    ]);

    const getActionColor = (action) => {
        if (action.includes('CREATE') || action === 'LOGIN') return 'text-green-600 bg-green-100';
        if (action.includes('ISOLIR') || action.includes('DELETE')) return 'text-red-600 bg-red-100';
        return 'text-blue-600 bg-blue-100';
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Audit Logs (CCTV Sistem)</h1>
                    <p className="text-gray-500 mt-1">Hanya Super Admin (Pemilik) yang dapat melihat halaman ini.</p>
                </div>
                <button className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded shadow transition flex items-center">
                    Unduh Laporan (PDF)
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-900 text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Waktu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Pengguna</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Aksi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Detail Aktivitas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.time}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {log.user} <span className="text-xs text-gray-400 ml-1">({log.role})</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{log.detail}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;