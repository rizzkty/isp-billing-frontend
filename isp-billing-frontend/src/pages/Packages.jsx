import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Server, Activity, DollarSign, X, Loader2 } from 'lucide-react';
import api from '../api';

const Packages = () => {
    // State untuk data paket
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', price: '', download: '', upload: '', profile: '', status: 'Aktif', description: '', speed: ''
    });

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/packages');
            setPackages(response.data);
        } catch (err) {
            console.error('Gagal mengambil paket:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    // Menangani Pencarian
    const filteredPackages = Array.isArray(packages) ? packages.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.profile?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    // Buka Modal untuk Tambah
    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', download: '', upload: '', profile: '', status: 'Aktif', description: '', speed: '' });
        setShowFormModal(true);
    };

    // Buka Modal untuk Edit
    const handleEdit = (pkg) => {
        setEditingId(pkg.id);
        setFormData({ ...pkg });
        setShowFormModal(true);
    };

    // Hapus Paket
    const handleDelete = async (id, name) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus paket "${name}"? Perhatian: Pelanggan yang sedang menggunakan paket ini mungkin akan terdampak.`)) {
            try {
                await api.delete(`/packages/${id}`);
                fetchPackages();
            } catch (err) {
                alert('Gagal menghapus paket');
            }
        }
    };

    // Simpan Form (Tambah / Edit)
    const handleSaveForm = async (e) => {
        e.preventDefault();
        
        // Buat field 'speed' otomatis dari download
        const dataToSend = {
            ...formData,
            speed: `${formData.download} Mbps`
        };

        try {
            if (editingId) {
                await api.put(`/packages/${editingId}`, dataToSend);
            } else {
                await api.post('/packages', dataToSend);
            }
            fetchPackages();
            setShowFormModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan paket');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fadeIn relative h-full">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Package className="w-8 h-8 mr-3 text-blue-600" />
                        Manajemen Layanan & Paket
                    </h1>
                    <p className="text-gray-500 mt-2">Kelola daftar paket internet, harga, limit bandwidth, dan profile Mikrotik Anda di sini.</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Cari nama / profile..." 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleAddNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center transition-transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Tambah Paket
                    </button>
                </div>
            </div>

            {/* Grid Kartu Paket */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Memuat daftar paket...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPackages.map((pkg) => (
                        <div key={pkg.id} className={`bg-white rounded-2xl border ${pkg.status === 'Aktif' ? 'border-gray-200 shadow-sm' : 'border-red-200 bg-red-50/30'} overflow-hidden transition-all hover:shadow-xl`}>
                            {/* Card Header */}
                            <div className={`px-6 py-4 border-b flex justify-between items-center ${pkg.status === 'Aktif' ? 'border-gray-100 bg-gray-50/50' : 'border-red-100 bg-red-50'}`}>
                                <h2 className="text-xl font-black text-gray-800">{pkg.name}</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${pkg.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {pkg.status}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                                <div className="flex items-end mb-6">
                                    <span className="text-3xl font-black text-blue-600">Rp {Number(pkg.price).toLocaleString('id-ID')}</span>
                                    <span className="text-gray-500 mb-1 ml-1 font-medium">/ bulan</span>
                                </div>

                                <p className="text-sm text-gray-600 mb-6 min-h-[40px] italic">"{pkg.description}"</p>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center text-sm font-medium text-gray-700">
                                        <Activity className="w-5 h-5 mr-3 text-purple-500" />
                                        <span>Bandwidth: <span className="font-bold text-gray-900">{pkg.download} Mbps <span className="text-gray-400 font-normal">(DL)</span> / {pkg.upload} Mbps <span className="text-gray-400 font-normal">(UL)</span></span></span>
                                    </div>
                                    <div className="flex items-center text-sm font-medium text-gray-700">
                                        <Server className="w-5 h-5 mr-3 text-orange-500" />
                                        <span>Mikrotik Profile: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-orange-700 border border-gray-200">{pkg.profile}</span></span>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={() => handleEdit(pkg)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl border border-gray-200 transition-colors flex justify-center items-center">
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id, pkg.name)} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl border border-red-200 transition-colors flex justify-center items-center">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredPackages.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-2xl">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="font-bold text-lg text-gray-400">Tidak ada paket yang ditemukan.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL TAMBAH/EDIT */}
            {showFormModal && (
                <div className="fixed inset-0 z-[9999] flex justify-center items-center animate-fadeIn p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFormModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden transform scale-100 animate-slideUp">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                {editingId ? <Edit className="w-5 h-5 mr-2 text-blue-500" /> : <Plus className="w-5 h-5 mr-2 text-blue-500" />}
                                {editingId ? 'Edit Paket Layanan' : 'Tambah Paket Baru'}
                            </h2>
                            <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveForm} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Paket Publik</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-800" placeholder="Contoh: Super Cepat 50 Mbps" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Harga Bulanan (Rp)</label>
                                    <div className="relative">
                                        <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-black text-gray-800" placeholder="150000" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Profile Mikrotik</label>
                                    <div className="relative">
                                        <Server className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input required type="text" value={formData.profile} onChange={e => setFormData({...formData, profile: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-sm text-gray-800" placeholder="profile-50m" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">Download Limit <span className="ml-1 text-xs text-gray-400 font-normal">(Mbps)</span></label>
                                    <input required type="number" min="1" value={formData.download} onChange={e => setFormData({...formData, download: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800" placeholder="50" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">Upload Limit <span className="ml-1 text-xs text-gray-400 font-normal">(Mbps)</span></label>
                                    <input required type="number" min="1" value={formData.upload} onChange={e => setFormData({...formData, upload: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800" placeholder="50" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Paket (SLA)</label>
                                    <textarea required rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800" placeholder="Keunggulan paket ini..."></textarea>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Status Penawaran</label>
                                    <div className="relative">
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-bold text-gray-700 cursor-pointer">
                                            <option value="Aktif">🟢 Aktif (Ditawarkan)</option>
                                            <option value="Tidak Aktif">🔴 Tidak Aktif (Disembunyikan)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowFormModal(false)} className="px-5 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">Batal</button>
                                <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" /> Simpan Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Packages;
