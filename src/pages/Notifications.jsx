import { useState } from 'react';
import { Send, History, FileText, Smartphone, Mail, AlertCircle, ChevronDown } from 'lucide-react';

const Notifications = () => {
    const [activeTab, setActiveTab] = useState('broadcast');
    const [formData, setFormData] = useState({ target: 'Semua Area', channel: 'WhatsApp', template: 'none', message: '' });

    // Dummy Templates
    const [templates] = useState([
        { id: 1, name: 'Tagihan Jatuh Tempo', text: 'Yth. [nama_pelanggan],\n\nTagihan internet Anda sebesar [total_tagihan] akan jatuh tempo besok. Mohon segera melakukan pembayaran agar koneksi tidak terputus.\n\nTerima kasih,\nISP NetBilling' },
        { id: 2, name: 'Gangguan Jaringan', text: 'Yth. Pelanggan,\n\nSaat ini sedang terjadi gangguan jaringan di area [area]. Teknisi kami sedang berada di lokasi untuk melakukan perbaikan. Estimasi perbaikan [estimasi_waktu].\n\nMohon maaf atas ketidaknyamanan ini.' },
        { id: 3, name: 'Promo & Info', text: 'Halo!\n\nNikmati upgrade speed internet Anda dengan diskon 50% bulan ini. Segera hubungi CS kami untuk info lebih lanjut.' }
    ]);

    // Dummy History
    const [historyLogs] = useState([
        { id: 1, date: '2026-04-22 10:00', target: 'Area Selatan (150 Pelanggan)', channel: 'WhatsApp', status: 'Selesai (148 Terkirim, 2 Gagal)', type: 'Broadcast Gangguan' },
        { id: 2, date: '2026-04-21 08:00', target: 'Semua Pelanggan Aktif', channel: 'Email', status: 'Selesai', type: 'Tagihan Bulanan' },
    ]);

    const handleTemplateChange = (e) => {
        const val = e.target.value;
        if (val === 'none') {
            setFormData({ ...formData, template: 'none', message: '' });
        } else {
            const tmpl = templates.find(t => t.id === parseInt(val));
            setFormData({ ...formData, template: val, message: tmpl.text });
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        alert(`Pesan sedang dikirim ke ${formData.target} via ${formData.channel}!`);
        setFormData({ target: 'Semua Area', channel: 'WhatsApp', template: 'none', message: '' });
    };

    return (
        <div className="p-8">
            <div className="mb-6 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Pusat Notifikasi & Broadcast</h1>
                <p className="text-gray-500 mt-1">Kelola pengumuman massal, template pesan, dan pantau log pengiriman ke pelanggan.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
                <button 
                    onClick={() => setActiveTab('broadcast')}
                    className={`flex items-center px-4 py-2 font-bold rounded-t-lg transition ${activeTab === 'broadcast' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Send className="w-4 h-4 mr-2" /> Kirim Broadcast
                </button>
                <button 
                    onClick={() => setActiveTab('templates')}
                    className={`flex items-center px-4 py-2 font-bold rounded-t-lg transition ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <FileText className="w-4 h-4 mr-2" /> Template Pesan
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center px-4 py-2 font-bold rounded-t-lg transition ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <History className="w-4 h-4 mr-2" /> Riwayat Pengiriman
                </button>
            </div>

            {/* Tab: Broadcast */}
            {activeTab === 'broadcast' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-5 text-gray-800">Buat Pesan Baru</h2>
                        <form onSubmit={handleSend} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Target Penerima</label>
                                    <div className="relative">
                                        <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                            <option value="Semua Area">Semua Area (Semua Pelanggan)</option>
                                            <option value="Area Utara">Area Utara</option>
                                            <option value="Area Selatan">Area Selatan</option>
                                            <option value="Pelanggan Tertunggak">Pelanggan Tertunggak (Belum Bayar)</option>
                                        </select>
                                        <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Kanal Pengiriman</label>
                                    <div className="relative">
                                        <select value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                            <option value="WhatsApp">WhatsApp Gateway</option>
                                            <option value="Email">Email (SMTP)</option>
                                        </select>
                                        <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Gunakan Template (Opsional)</label>
                                <div className="relative">
                                    <select value={formData.template} onChange={handleTemplateChange} className="w-full border border-gray-300 rounded-lg p-2.5 appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 cursor-pointer">
                                        <option value="none">-- Tulis Pesan Kustom Baru --</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Isi Pesan</label>
                                <textarea 
                                    required 
                                    rows="7" 
                                    value={formData.message}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                                    placeholder="Ketik pesan Anda di sini..."
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Anda bisa menggunakan tag seperti <code className="bg-gray-100 px-1 mx-1 rounded">[nama_pelanggan]</code>, <code className="bg-gray-100 px-1 mx-1 rounded">[total_tagihan]</code> yang akan terganti otomatis.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-md font-bold flex items-center transition">
                                    <Send className="w-4 h-4 mr-2" /> Kirim Sekarang
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="w-full md:w-80 bg-gray-50 rounded-xl p-6 border border-gray-200 h-fit sticky top-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-700">
                            {formData.channel === 'WhatsApp' ? <Smartphone className="w-5 h-5 text-green-600" /> : <Mail className="w-5 h-5 text-blue-600" />}
                            <h3 className="font-bold text-lg">Preview Pesan</h3>
                        </div>
                        <div className={`p-4 rounded-xl text-sm whitespace-pre-wrap shadow-sm leading-relaxed ${formData.channel === 'WhatsApp' ? 'bg-[#e1f5c4] text-gray-800' : 'bg-white border text-gray-700'}`}>
                            {formData.message || <span className="text-gray-400 italic">Pesan akan muncul di sini...</span>}
                        </div>
                        {formData.channel === 'WhatsApp' && (
                            <p className="text-[10px] text-center text-gray-400 mt-2">Tampilan simulasi WhatsApp</p>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Templates */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition group">
                            <h3 className="font-bold text-lg mb-3 text-gray-800">{tmpl.name}</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 h-40 overflow-y-auto mb-4 whitespace-pre-wrap font-mono leading-relaxed">
                                {tmpl.text}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button className="text-blue-600 text-sm font-bold hover:underline">Edit Template</button>
                                <button className="text-red-600 text-sm font-bold hover:underline">Hapus</button>
                            </div>
                        </div>
                    ))}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition min-h-[220px] group">
                        <div className="text-center text-gray-400 group-hover:text-blue-500 transition">
                            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-70 group-hover:opacity-100" />
                            <p className="font-bold text-lg">+ Buat Template Baru</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Kirim</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis Pesan / Kanal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target Penerima</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status Pengiriman</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {historyLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">{log.date}</td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="font-bold text-sm text-gray-900">{log.type}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                            {log.channel === 'WhatsApp' ? <Smartphone className="w-3 h-3 mr-1 inline" /> : <Mail className="w-3 h-3 mr-1 inline" />}
                                            {log.channel}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">{log.target}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${log.status.includes('Selesai') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Notifications;
