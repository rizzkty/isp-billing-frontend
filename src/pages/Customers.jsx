import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, UserPlus, Info, Edit, Trash2, MessageCircle } from 'lucide-react';

const Customers = () => {
    const { user } = useAuth(); // Mengambil data siapa yang sedang login
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [messageText, setMessageText] = useState('');

    // Data pura-pura (dummy) sebelum kita sambungkan ke database aslinya
    const [customers] = useState([
        { id: 1, name: 'Budi Santoso', package: '10 Mbps', ip: '192.168.1.10', status: 'Aktif' },
        { id: 2, name: 'Siti Aminah', package: '20 Mbps', ip: '192.168.1.11', status: 'Isolir' },
        { id: 3, name: 'Toko Makmur', package: '50 Mbps', ip: '192.168.1.12', status: 'Putus' },
    ]);

    // Fungsi pembantu untuk mewarnai status
    const getStatusColor = (status) => {
        if (status === 'Aktif') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'Isolir') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Data Pelanggan</h1>
                
                {/* Tombol Tambah Pelanggan: Hanya muncul untuk Pemilik & Admin */}
                {(user?.role === 'pemilik' || user?.role === 'admin') && (
                    <button 
                        onClick={() => alert('Fitur penambahan pelanggan sedang dalam pengembangan. Nanti akan memunculkan Form Pendaftaran langsung disini.')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow hover-lift transition font-bold flex items-center"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Tambah Pelanggan
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paket</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((cust) => (
                            <tr key={cust.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cust.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cust.package}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{cust.ip}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(cust.status)}`}>
                                        {cust.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium flex justify-center gap-2">
                                    <button 
                                        onClick={() => alert(`Menampilkan detail profil lengkap pelanggan: ${cust.name}`)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition font-bold flex items-center hover-lift"
                                    >
                                        <Info className="w-3 h-3 mr-1" /> Detail
                                    </button>

                                    {/* Tombol Edit/Hapus hanya untuk Pemilik & Admin */}
                                    {(user?.role === 'pemilik' || user?.role === 'admin') && (
                                        <>
                                            <button 
                                                onClick={() => { setSelectedCustomer(cust); setShowMessageModal(true); setMessageText(''); }}
                                                className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-md transition font-bold flex items-center hover-lift"
                                                title="Kirim Pesan WA"
                                            >
                                                <MessageCircle className="w-3 h-3 mr-1" /> Pesan
                                            </button>
                                            <button 
                                                onClick={() => alert(`Membuka form edit data untuk: ${cust.name}`)}
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md transition font-bold flex items-center hover-lift"
                                            >
                                                <Edit className="w-3 h-3 mr-1" /> Edit
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm(`Yakin ingin menghapus data pelanggan ${cust.name}? Data tagihan yang terkait juga akan dihapus.`)) {
                                                        alert(`Data ${cust.name} berhasil dihapus secara permanen.`);
                                                    }
                                                }}
                                                className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-md transition font-bold flex items-center hover-lift"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" /> Hapus
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Kirim Pesan Personal */}
            {showMessageModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Pesan Personal: {selectedCustomer.name}
                            </h3>
                            <button onClick={() => setShowMessageModal(false)} className="hover:bg-green-700 p-1 rounded transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tulis Pesan WhatsApp</label>
                            <textarea 
                                rows="4" 
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                                placeholder={`Ketik pesan untuk ${selectedCustomer.name}...`}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    onClick={() => setShowMessageModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={() => {
                                        alert(`Pesan berhasil dikirim ke ${selectedCustomer.name}:\n\n"${messageText}"`);
                                        setShowMessageModal(false);
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center transition"
                                >
                                    <Send className="w-4 h-4 mr-2" /> Kirim
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;