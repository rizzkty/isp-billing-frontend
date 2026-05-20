import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useToast } from '../components/Toast';
import ExportButton from '../components/ExportButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { MessageSquare, X, Send, UserPlus, Info, Edit, Trash2, MessageCircle, AlertTriangle, CheckCircle, Search, Activity, MapPin, Phone, Calendar, ChevronDown, Loader2, ExternalLink } from 'lucide-react';

const Customers = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    // --- STATE DATA ---
    const [customers, setCustomers] = useState([]);
    const [packages, setPackages] = useState([]); // State untuk daftar paket
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [portalLinkLoading, setPortalLinkLoading] = useState(null); // stores customer id being processed

    // --- UI STATES ---
    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState('success'); // 'success' | 'error'
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form Modal State (Add/Edit)
    const [showFormModal, setShowFormModal] = useState(false);
    const emptyForm = { id: null, name: '', phone: '', email: '', installation_date: new Date().toISOString().split('T')[0], package_id: '', package_name: '', ip_address: '', address: '', latitude: '', longitude: '', ont_brand: '', router_brand: '', notes: '', status: 'aktif' };
    const [formData, setFormData] = useState(emptyForm);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    // Bulk Delete State
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Slide-over Detail State
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Message Modal State
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');

    // --- DATA FETCHING ---
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (err) {
            showToast('Gagal mengambil data pelanggan');
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const response = await api.get('/packages');
            setPackages(response.data);
        } catch (err) {
            console.error('Gagal mengambil paket:', err);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchPackages();
    }, []);

    // --- HANDLERS ---
    const showToast = (msg, type = 'success') => {
        addToast(msg, type);
    };

    const handleOpenForm = (cust = null) => {
        if (cust) {
            setFormData({ ...emptyForm, ...cust });
        } else {
            setFormData({ 
                ...emptyForm,
                installation_date: new Date().toISOString().split('T')[0]
            }); 
        }
        setShowFormModal(true);
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (formData.id) {
                await api.put(`/customers/${formData.id}`, formData);
                showToast('✅ Data pelanggan berhasil diperbarui!', 'success');
            } else {
                await api.post('/customers', formData);
                showToast('✅ Pelanggan baru berhasil ditambahkan!', 'success');
            }
            fetchCustomers();
            setShowFormModal(false);
        } catch (err) {
            // Ambil pesan validasi dari Laravel jika ada
            const errData = err.response?.data;
            let errMsg = 'Gagal menyimpan data';
            if (errData?.errors) {
                // Ambil pesan error pertama dari validasi Laravel
                const firstKey = Object.keys(errData.errors)[0];
                errMsg = errData.errors[firstKey][0];
            } else if (errData?.message) {
                errMsg = errData.message;
            }
            showToast('❌ ' + errMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (cust) => {
        setCustomerToDelete(cust);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            setSaving(true);
            await api.delete(`/customers/${customerToDelete.id}`);
            fetchCustomers();
            setShowDeleteModal(false);
            showToast(`🗑️ Data pelanggan ${customerToDelete.name} berhasil dihapus.`, 'success');
        } catch (err) {
            showToast('❌ Gagal menghapus pelanggan', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Bulk Delete Functions
    const toggleSelectAll = () => {
        if (selectedCustomers.length === customers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(customers.map(c => c.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedCustomers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        try {
            setSaving(true);
            let successCount = 0;
            let failedCount = 0;
            
            for (const id of selectedCustomers) {
                try {
                    await api.delete(`/customers/${id}`);
                    successCount++;
                } catch (err) {
                    console.error(`Gagal menghapus pelanggan ID ${id}:`, err);
                    failedCount++;
                }
            }
            
            fetchCustomers();
            setSelectedCustomers([]);
            setShowBulkDeleteModal(false);
            
            if (failedCount === 0) {
                showToast(`✅ ${successCount} pelanggan berhasil dihapus.`, 'success');
            } else if (successCount === 0) {
                showToast(`❌ Gagal menghapus ${failedCount} pelanggan.`, 'error');
            } else {
                showToast(`⚠️ ${successCount} berhasil, ${failedCount} gagal dihapus.`, 'error');
            }
        } catch (err) {
            console.error('Bulk delete error:', err);
            showToast('❌ Terjadi kesalahan saat menghapus data.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSendMessage = () => {
        setShowMessageModal(false);
        showToast(`Pesan terkirim ke ${selectedCustomer.name}`);
        setMessageText('');
    };

    const openDetailPanel = (cust) => {
        setSelectedCustomer(cust);
        setShowDetailPanel(true);
    };

    const handleOpenPortal = async (cust) => {
        setPortalLinkLoading(cust.id);
        // Buka tab SEBELUM await agar tidak diblokir popup blocker browser
        const newTab = window.open('', '_blank');
        if (newTab) {
            newTab.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc"><p style="color:#6b7280;font-size:14px">⏳ Memuat portal <strong>' + cust.name + '</strong>...</p></body></html>');
        }
        try {
            const res = await api.post(`/customers/${cust.id}/portal-link`);
            const url = res.data.portal_url;
            if (newTab) {
                newTab.location.href = url;
            } else {
                window.location.href = url;
            }
            showToast(`✅ Portal ${cust.name} berhasil dibuka!`, 'success');
        } catch (err) {
            if (newTab) newTab.close();
            showToast('❌ Gagal generate link portal. Coba lagi.', 'error');
        } finally {
            setPortalLinkLoading(null);
        }
    };

    // --- HELPERS ---
    const getStatusColor = (status) => {
        if (status === 'aktif') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'terisolir') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    // Cek apakah pelanggan mendekati tenggat bayar (invoice unpaid & due <= 3 hari)
    const isNearDue = (cust) => {
        if (!cust.invoices) return false;
        const unpaid = cust.invoices.find(inv => inv.status === 'unpaid');
        if (!unpaid || !unpaid.due_date) return false;
        const daysLeft = Math.ceil((new Date(unpaid.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 3;
    };

    const getPortalBtnStyle = (cust) => {
        if (cust.status === 'terisolir') return 'bg-red-50 hover:bg-red-100 text-red-700 ring-1 ring-red-200';
        if (isNearDue(cust)) return 'bg-orange-50 hover:bg-orange-100 text-orange-700 ring-1 ring-orange-200';
        return 'bg-purple-50 hover:bg-purple-100 text-purple-700';
    };

    const getPortalBtnTitle = (cust) => {
        if (cust.status === 'terisolir') return '⚠️ Buka Portal (Terisolir — perlu bayar!)';
        if (isNearDue(cust)) return '⏰ Buka Portal (Mendekati Tenggat Bayar!)';
        return '🌐 Buka Portal Pelanggan';
    };

    const filteredCustomers = Array.isArray(customers) ? customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.status.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="p-8 relative min-h-screen">
            
            {/* --- TOAST NOTIFICATION --- */}
            <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border max-w-sm text-center ${
                    toastType === 'error'
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-gray-900 border-gray-700 text-white'
                }`}>
                    {toastType === 'error'
                        ? <AlertTriangle className="w-5 h-5 text-red-200 shrink-0" />
                        : <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Data Pelanggan</h1>
                    <p className="text-gray-500 mt-1">Manajemen informasi dan status koneksi klien.</p>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                    <div className="relative group">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari nama, IP, atau status..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none shadow-sm w-72 transition-all"
                        />
                    </div>
                    <ExportButton
                        data={filteredCustomers}
                        filename="customers"
                        columns={[
                            { header: 'ID Pelanggan', accessor: 'customer_id' },
                            { header: 'Nama', accessor: 'name' },
                            { header: 'Email', accessor: 'email' },
                            { header: 'Telepon', accessor: 'phone' },
                            { header: 'Paket', accessor: 'package_name' },
                            { header: 'IP Address', accessor: 'ip_address' },
                            { header: 'Alamat', accessor: 'address' },
                            { header: 'Status', accessor: 'status' },
                            { header: 'Tgl Instalasi', accessor: 'installation_date' },
                        ]}
                    />
                    {(user?.role === 'pemilik' || user?.role === 'admin') && (
                        <button 
                            onClick={() => handleOpenForm()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all font-bold flex items-center"
                        >
                            <UserPlus className="w-5 h-5 mr-2" /> Tambah Pelanggan
                        </button>
                    )}
                    {selectedCustomers.length > 0 && (
                        <button
                            onClick={() => setShowBulkDeleteModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all font-bold flex items-center"
                        >
                            <Trash2 className="w-5 h-5 mr-2" /> Hapus Terpilih ({selectedCustomers.length})
                        </button>
                    )}
                </div>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-4 py-4 text-left w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Kontak</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paket</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredCustomers.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">Data tidak ditemukan.</td></tr>
                        ) : (
                            filteredCustomers.map((cust) => (
                                <tr key={cust.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedCustomers.includes(cust.id)}
                                            onChange={() => toggleSelect(cust.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cust.name}</span>
                                            <span className="text-xs text-gray-500">{cust.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{cust.package_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{cust.ip_address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(cust.status)}`}>
                                            {cust.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium flex justify-center gap-2">
                                        <button 
                                            onClick={() => openDetailPanel(cust)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all font-bold flex items-center"
                                            title="Detail Pelanggan"
                                        >
                                            <Info className="w-4 h-4" />
                                        </button>

                                        {/* Tombol Masuk ke Portal — tersedia untuk admin & pemilik */}
                                        {(user?.role === 'pemilik' || user?.role === 'admin') && (
                                            <button
                                                onClick={() => handleOpenPortal(cust)}
                                                disabled={portalLinkLoading === cust.id}
                                                className={`px-3 py-2 rounded-lg transition-all font-bold flex items-center gap-1 relative ${getPortalBtnStyle(cust)} disabled:opacity-60`}
                                                title={getPortalBtnTitle(cust)}
                                            >
                                                {portalLinkLoading === cust.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4" />
                                                )}
                                                {(cust.status === 'terisolir') && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                                                )}
                                                {isNearDue(cust) && cust.status !== 'terisolir' && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white animate-pulse" />
                                                )}
                                            </button>
                                        )}

                                        {(user?.role === 'pemilik' || user?.role === 'admin') && (
                                            <>
                                                <button 
                                                    onClick={() => { setSelectedCustomer(cust); setShowMessageModal(true); setMessageText(''); }}
                                                    className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-all font-bold flex items-center"
                                                    title="Kirim Pesan WA"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenForm(cust)}
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-all font-bold flex items-center"
                                                    title="Edit Data"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(cust)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition-all font-bold flex items-center"
                                                    title="Hapus Data"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- SLIDE-OVER DETAIL PANEL --- */}
            <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${showDetailPanel ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${showDetailPanel ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setShowDetailPanel(false)}
                ></div>
                
                {/* Slide Panel */}
                <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${showDetailPanel ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-xl font-black text-gray-800">Profil Pelanggan</h2>
                        <button onClick={() => setShowDetailPanel(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    
                    {selectedCustomer && (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Card Header */}
                            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30">
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(selectedCustomer.status)}`}>
                                        {selectedCustomer.status}
                                    </span>
                                </div>
                            </div>

                            {/* Info Blocks */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <Activity className="w-5 h-5 text-blue-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Paket Layanan & IP</p>
                                        <p className="font-bold text-gray-800">{selectedCustomer.package_name} <span className="text-gray-300 mx-2">|</span> <span className="font-mono text-sm">{selectedCustomer.ip_address || '-'}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <Phone className="w-5 h-5 text-teal-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Nomor HP / WA</p>
                                        <p className="font-bold text-gray-800">{selectedCustomer.phone || '-'}</p>
                                        {selectedCustomer.email && <p className="text-sm text-gray-500">{selectedCustomer.email}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Alamat Instalasi</p>
                                        <p className="font-bold text-gray-800 leading-relaxed">{selectedCustomer.address || '-'}</p>
                                        {(selectedCustomer.latitude && selectedCustomer.longitude) && (
                                            <p className="text-xs font-mono text-gray-400 mt-1">{selectedCustomer.latitude}, {selectedCustomer.longitude}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <Calendar className="w-5 h-5 text-purple-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Tanggal Pasang</p>
                                        <p className="font-bold text-gray-800">{selectedCustomer.installation_date || '-'}</p>
                                    </div>
                                </div>
                                {(selectedCustomer.ont_brand || selectedCustomer.router_brand) && (
                                    <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <Activity className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">Perangkat</p>
                                            {selectedCustomer.ont_brand && <p className="text-sm text-gray-700">ONT: <span className="font-bold">{selectedCustomer.ont_brand}</span></p>}
                                            {selectedCustomer.router_brand && <p className="text-sm text-gray-700">Router: <span className="font-bold">{selectedCustomer.router_brand}</span></p>}
                                        </div>
                                    </div>
                                )}
                                {selectedCustomer.notes && (
                                    <div className="flex items-start gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                        <MessageSquare className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-yellow-600 uppercase">Catatan</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{selectedCustomer.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
                        {/* Tombol Masuk ke Portal di Detail Panel */}
                        {(user?.role === 'pemilik' || user?.role === 'admin') && selectedCustomer && (
                            <button
                                onClick={() => { setShowDetailPanel(false); handleOpenPortal(selectedCustomer); }}
                                disabled={portalLinkLoading === selectedCustomer?.id}
                                className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                                    selectedCustomer?.status === 'terisolir'
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                                        : isNearDue(selectedCustomer)
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
                                } disabled:opacity-60`}
                            >
                                {portalLinkLoading === selectedCustomer?.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ExternalLink className="w-5 h-5" />
                                )}
                                {selectedCustomer?.status === 'terisolir'
                                    ? '⚠️ Buka Portal (Terisolir)'
                                    : isNearDue(selectedCustomer)
                                    ? '⏰ Buka Portal (Tenggat Dekat!)'
                                    : '🌐 Masuk ke Portal Pelanggan'
                                }
                            </button>
                        )}
                        <button 
                            onClick={() => { setShowDetailPanel(false); setShowMessageModal(true); }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageSquare className="w-5 h-5" /> Hubungi Pelanggan
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL FORM TAMBAH/EDIT --- */}
            {showFormModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => (saving ? undefined : setShowFormModal(false))}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-fadeIn">
                        {saving && <LoadingSpinner overlay={true} text="Menyimpan data..." />}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                {formData.id ? <Edit className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                                {formData.id ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                            </h2>
                            <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Nama pelanggan" />
                            </div>

                            {/* No HP & Tanggal Pasang */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">No HP</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="08xx" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Pasang</label>
                                    <input type="date" value={formData.installation_date} onChange={e => setFormData({...formData, installation_date: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email (Gmail)</label>
                                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="contoh@gmail.com" />
                            </div>

                            {/* Paket */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Paket <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.package_id || ''}
                                        onChange={e => {
                                            const pkg = packages.find(p => p.id === parseInt(e.target.value));
                                            setFormData({ ...formData, package_id: e.target.value, package_name: pkg ? pkg.name : '' });
                                        }}
                                        className="w-full border border-gray-300 rounded-xl p-3 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-700 cursor-pointer"
                                    >
                                        <option value="">— Pilih Paket —</option>
                                        {packages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>{pkg.name} - Rp {Number(pkg.price).toLocaleString('id-ID')}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Alamat */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Alamat</label>
                                <textarea rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" placeholder="Alamat lengkap" />
                            </div>

                            {/* Lokasi */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Lokasi (Opsional)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
                                        <input type="number" step="any" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-sm" placeholder="-7.xxxxx" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
                                        <input type="number" step="any" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-sm" placeholder="110.xxxxx" />
                                    </div>
                                </div>
                            </div>

                            {/* Perangkat */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Perangkat (Opsional)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Merk ONT</label>
                                        <input type="text" value={formData.ont_brand || ''} onChange={e => setFormData({...formData, ont_brand: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Huawei, ZTE..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Merk Router</label>
                                        <input type="text" value={formData.router_brand || ''} onChange={e => setFormData({...formData, router_brand: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="TP-Link, Mikrotik..." />
                                    </div>
                                </div>
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Catatan</label>
                                <textarea rows="3" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" placeholder="Catatan tambahan..." />
                            </div>

                            {/* Status (edit mode saja) */}
                            {formData.id && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                    <div className="relative">
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-700 cursor-pointer">
                                            <option value="aktif">🟢 Aktif</option>
                                            <option value="terisolir">🟡 Isolir</option>
                                            <option value="nonaktif">🔴 Putus</option>
                                        </select>
                                        <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowFormModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL KONFIRMASI HAPUS --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => (saving ? undefined : setShowDeleteModal(false))}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-fadeIn p-6 text-center">
                        {saving && <LoadingSpinner overlay={true} text="Menghapus pelanggan..." />}
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Pelanggan?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus data <span className="font-bold text-gray-800">{customerToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan dan semua data tagihan terkait akan hilang.</p>
                        
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">Batal</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all">Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL KONFIRMASI BULK DELETE --- */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => (saving ? undefined : setShowBulkDeleteModal(false))}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-fadeIn p-6 text-center">
                        {saving && <LoadingSpinner overlay={true} text="Menghapus data terpilih..." />}
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Hapus {selectedCustomers.length} Pelanggan?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus {selectedCustomers.length} data pelanggan yang dipilih? Tindakan ini tidak dapat dibatalkan.</p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkDeleteModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">Batal</button>
                            <button onClick={handleBulkDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all">Ya, Hapus Semua</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL PESAN WA --- */}
            {showMessageModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowMessageModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fadeIn">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center text-lg">
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Pesan WA: {selectedCustomer?.name}
                            </h3>
                            <button onClick={() => setShowMessageModal(false)} className="hover:bg-green-700 p-1.5 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <textarea 
                                rows="5" 
                                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                                placeholder={`Ketik pesan personal untuk ${selectedCustomer?.name}...`}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end gap-3 mt-5">
                                <button onClick={() => setShowMessageModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">Batal</button>
                                <button 
                                    onClick={handleSendMessage}
                                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center shadow-lg shadow-green-500/30 transition-all"
                                >
                                    <Send className="w-4 h-4 mr-2" /> Kirim Pesan
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