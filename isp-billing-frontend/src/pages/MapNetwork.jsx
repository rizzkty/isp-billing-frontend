import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, ChevronRight, Filter, Activity, Server, Thermometer, Database, Lock, Unlock, Layers, X, Navigation, GripHorizontal, Share2, Wifi, ChevronDown, Globe, Clock, Trash2, Zap, Loader2, Check, AlertTriangle, User } from 'lucide-react';

// === KONFIGURASI IKON SPESIFIK (V3 - SVG DIV ICON) ===
const getIcon = (type, status) => {
    let iconHtml = '';
    const colorClass = status === 'los' ? 'text-red-500 animate-pulse' : 
                       (type === 'server' ? 'text-blue-400' : 
                        type === 'odc' ? 'text-orange-400' : 
                        type === 'odp' ? 'text-purple-400' : 'text-blue-300');

    if (type === 'server') {
        iconHtml = `<div class="bg-gray-900 border-2 border-blue-500 rounded-lg p-1.5 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-server ${colorClass}"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg></div>`;
    } else if (type === 'odc') {
        iconHtml = `<div class="bg-gray-900 border-2 border-orange-500 rounded-lg p-1.5 shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cable ${colorClass}"><path d="M4 9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.5"/><path d="M8.5 9v5.5a2.5 2.5 0 0 0 5 0V9"/><path d="M12.5 14.5v5.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2z"/></svg></div>`;
    } else if (type === 'odp') {
        iconHtml = `<div class="bg-gray-900 border-2 border-purple-500 rounded-lg p-1 shadow-[0_0_10px_rgba(168,85,247,0.5)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-router ${colorClass}"><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18H6"/><path d="M10.01 18H10"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/></svg></div>`;
    } else {
        iconHtml = `<div class="bg-gray-800 border ${status === 'los' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'border-blue-300'} rounded-full p-1 shadow-lg flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user ${colorClass}"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
    }

    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon', 
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
    });
};

const MapClickHandler = ({ onMapClick, active }) => {
    useMapEvents({
        click: (e) => { if (active) onMapClick(e.latlng); },
    });
    return null;
};

const MapNetwork = () => {
    const { user } = useAuth();
    const isAdminOrPemilik = user?.role === 'admin' || user?.role === 'pemilik';

    // State Utama Jaringan
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [netRes, custRes] = await Promise.all([
                api.get('/network'),
                api.get('/customers')
            ]);
            setNodes(netRes.data.nodes);
            setEdges(netRes.data.edges);
            setCustomers(custRes.data);
        } catch (err) {
            showToast('Gagal mengambil data jaringan', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // View States
    const [mapTheme, setMapTheme] = useState('dark');
    const [isMapLocked, setIsMapLocked] = useState(true);
    const [filterMode, setFilterMode] = useState('all');
    const [isFabOpen, setIsFabOpen] = useState(false); 

    // Editor States
    const [editMode, setEditMode] = useState(null); 
    const [tempCoords, setTempCoords] = useState(null);
    
    // Side Panel States
    const [activeNode, setActiveNode] = useState(null); 
    const [formData, setFormData] = useState({ name: '', parent_id: '', package: '10 Mbps', cable_color: '#3b82f6', port: '', customer_id: '' });

    // Drag Logic
    const handleDragEnd = async (e, id) => {
        if (isMapLocked || !isAdminOrPemilik) return;
        const marker = e.target;
        const position = marker.getLatLng();
        try {
            await api.put(`/network/nodes/${id}`, { lat: position.lat, lng: position.lng });
            setNodes(nodes.map(n => n.id === id ? { ...n, lat: position.lat, lng: position.lng } : n));
            showToast('Posisi berhasil diperbarui');
        } catch (err) {
            showToast('Gagal memperbarui posisi', 'error');
        }
    };

    // Buka Panel Edit
    const openEditPanel = (node) => {
        setActiveNode(node);
        setFormData({ 
            name: node.name, 
            parent_id: node.parent_id || '', 
            package: node.customer?.package_name || '10 Mbps',
            cable_color: node.cable_color || (node.type === 'customer' ? '#3b82f6' : '#10b981'),
            port: node.port || '',
            customer_id: node.customer_id || ''
        });
        setEditMode(null);
        setTempCoords(null);
    };

    const handleSavePanel = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await api.put(`/network/nodes/${activeNode.id}`, formData);
            showToast('Konfigurasi berhasil disimpan');
            fetchData();
            setActiveNode(null);
        } catch (err) {
            showToast('Gagal menyimpan konfigurasi', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteNode = async () => {
        if (!activeNode) return;
        if (!window.confirm(`Hapus ${activeNode.name} dari peta?`)) return;
        
        try {
            setActionLoading(true);
            await api.delete(`/network/nodes/${activeNode.id}`);
            showToast('Titik jaringan dihapus');
            fetchData();
            setActiveNode(null);
        } catch (err) {
            showToast('Gagal menghapus titik', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddNode = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const payload = {
                ...formData,
                type: editMode,
                lat: tempCoords.lat,
                lng: tempCoords.lng,
            };
            await api.post('/network/nodes', payload);
            showToast('Titik jaringan baru ditambahkan');
            fetchData();
            setEditMode(null);
            setTempCoords(null);
        } catch (err) {
            showToast('Gagal menambahkan titik', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Auto-fill customer data
    const handleCustomerSelect = (id) => {
        const cust = customers.find(c => c.id === parseInt(id));
        if (cust) {
            setFormData(prev => ({
                ...prev,
                customer_id: id,
                name: cust.name,
                package: cust.package_name
            }));
            if (cust.latitude && cust.longitude && tempCoords) {
                setTempCoords({ lat: parseFloat(cust.latitude), lng: parseFloat(cust.longitude) });
            }
        }
    };

    const visibleNodes = useMemo(() => {
        if (filterMode === 'backbone') return nodes.filter(n => n.type !== 'customer');
        if (filterMode === 'los') return nodes.filter(n => n.status === 'los' || n.type !== 'customer');
        return nodes;
    }, [nodes, filterMode]);

    const getTileLayer = () => {
        if (mapTheme === 'dark') return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
        if (mapTheme === 'hybrid') return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    };

    return (
        <div className="relative w-full h-screen bg-[#111827] overflow-hidden -m-6 z-0 flex">
            {/* TOAST */}
            {toast && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000]">
                    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border text-white ${toast.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-gray-900 border-gray-700'}`}>
                        {toast.type === 'error' ? <AlertTriangle className="w-4 h-4"/> : <Check className="w-4 h-4 text-green-400"/>}
                        <span className="font-bold text-sm">{toast.msg}</span>
                    </div>
                </div>
            )}

            {/* WIDGET RESOURCE (Kiri Atas) */}
            <div className="absolute top-6 left-6 z-[1000] dark-glass-panel rounded-xl p-4 shadow-2xl text-white text-xs font-mono w-64 pointer-events-none">
                <div className="flex items-center justify-between border-b border-gray-600 pb-3 mb-3">
                    <span className="font-bold flex items-center text-sm"><Server className="w-4 h-4 mr-2 text-blue-400"/> NOC PUSAT <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">DEMO</span></span>
                    <span className="text-green-400 font-bold flex items-center bg-green-900/30 px-2 py-1 rounded">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1.5"></span> RUNNING
                    </span>
                </div>
                <div className="space-y-3 opacity-75">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-300">CPU Load</span><span className="font-bold text-white">12%</span>
                        </div>
                        <div className="w-full bg-gray-700 h-1.5 rounded-full"><div className="bg-blue-400 h-1.5 rounded-full" style={{width: '12%'}}></div></div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-300">RAM Usage</span><span className="font-bold text-white">40%</span>
                        </div>
                        <div className="w-full bg-gray-700 h-1.5 rounded-full"><div className="bg-purple-400 h-1.5 rounded-full" style={{width: '40%'}}></div></div>
                    </div>
                </div>
            </div>

            {/* FILTER PETA (Kiri Bawah) */}
            <div className="absolute bottom-6 left-6 z-[1000] dark-glass-panel p-3 rounded-xl shadow-2xl border border-gray-700">
                <h3 className="text-[10px] font-bold text-gray-400 mb-2 flex items-center uppercase tracking-widest"><Filter className="w-3 h-3 mr-1 text-blue-400"/> Map Filters</h3>
                <div className="relative">
                    <select 
                        className="text-xs border border-gray-600 rounded p-1.5 pr-6 appearance-none bg-gray-800 text-white font-semibold outline-none focus:border-blue-500 w-full cursor-pointer transition-colors"
                        value={filterMode} 
                        onChange={e => setFilterMode(e.target.value)}
                    >
                        <option value="all">Tampilkan Seluruh Titik</option>
                        <option value="backbone">Sembunyikan Pelanggan (Core Only)</option>
                        <option value="los">⚠️ Filter Pelanggan LOS Saja</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* TOOLBAR KANAN ATAS (Theme, Lock, & FAB Add Node) */}
            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 items-center">
                <div className="dark-glass-panel p-1.5 rounded-full shadow-2xl flex flex-col gap-1 border border-gray-700">
                    <button onClick={() => setMapTheme('dark')} className={`p-2.5 rounded-full transition ${mapTheme === 'dark' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title="Dark Map"><Layers className="w-4 h-4" /></button>
                    <button onClick={() => setMapTheme('hybrid')} className={`p-2.5 rounded-full transition ${mapTheme === 'hybrid' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title="Hybrid/Satelit Map"><Navigation className="w-4 h-4" /></button>
                </div>

                {isAdminOrPemilik && (
                    <>
                        <button 
                            onClick={() => setIsMapLocked(!isMapLocked)}
                            className={`p-3 rounded-full shadow-2xl dark-glass-panel flex justify-center items-center transition-all border ${isMapLocked ? 'text-gray-400 border-gray-700 hover:bg-gray-800' : 'text-red-400 border-red-500/50 bg-red-900/30 ring-2 ring-red-500/50'}`}
                        >
                            {isMapLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5 animate-pulse" />}
                        </button>

                        <div className="relative flex flex-row-reverse items-center mt-2 group z-50">
                            <button 
                                onClick={() => setIsFabOpen(!isFabOpen)}
                                className={`p-3.5 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all duration-300 z-10 border border-blue-500/50 ${isFabOpen ? 'bg-red-500 text-white rotate-45 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-110'}`}
                            >
                                <Plus className="w-6 h-6" />
                            </button>

                            <div className={`absolute right-16 flex flex-row-reverse gap-3 transition-all duration-300 ease-in-out ${isFabOpen ? 'opacity-100 translate-x-0 visible' : 'opacity-0 translate-x-10 invisible'}`}>
                                <div className="flex flex-col items-center justify-end gap-1 group/btn">
                                    <button onClick={() => {setEditMode('server'); setFormData({name:'',parent_id:'',customer_id:''}); setTempCoords(null); setIsFabOpen(false);}} className="p-3 bg-gray-800 text-blue-400 hover:bg-gray-700 hover:scale-110 rounded-full shadow-lg border border-gray-600 transition-transform"><Server className="w-5 h-5" /></button>
                                    <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity absolute -bottom-8 whitespace-nowrap">Core/OLT</span>
                                </div>
                                <div className="flex flex-col items-center justify-end gap-1 group/btn">
                                    <button onClick={() => {setEditMode('odc'); setFormData({name:'',parent_id:'',customer_id:''}); setTempCoords(null); setIsFabOpen(false);}} className="p-3 bg-gray-800 text-orange-400 hover:bg-gray-700 hover:scale-110 rounded-full shadow-lg border border-gray-600 transition-transform"><Share2 className="w-5 h-5" /></button>
                                    <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity absolute -bottom-8 whitespace-nowrap">Switch/ODC</span>
                                </div>
                                <div className="flex flex-col items-center justify-end gap-1 group/btn">
                                    <button onClick={() => {setEditMode('odp'); setFormData({name:'',parent_id:'',customer_id:''}); setTempCoords(null); setIsFabOpen(false);}} className="p-3 bg-gray-800 text-purple-400 hover:bg-gray-700 hover:scale-110 rounded-full shadow-lg border border-gray-600 transition-transform"><Wifi className="w-5 h-5" /></button>
                                    <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity absolute -bottom-8 whitespace-nowrap">Splitter/ODP</span>
                                </div>
                                <div className="flex flex-col items-center justify-end gap-1 group/btn">
                                    <button onClick={() => {setEditMode('customer'); setFormData({name:'',parent_id:'',customer_id:''}); setTempCoords(null); setIsFabOpen(false);}} className="p-3 bg-gray-800 text-blue-400 hover:bg-gray-700 hover:scale-110 rounded-full shadow-lg border border-gray-600 transition-transform"><User className="w-5 h-5" /></button>
                                    <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity absolute -bottom-8 whitespace-nowrap">Pelanggan</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* FORM TAMBAH TITIK */}
            {tempCoords && editMode && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] w-80 dark-glass-panel p-5 rounded-xl shadow-2xl border-t-4 border-blue-500 animate-fadeIn">
                    <h3 className="font-bold mb-4 uppercase text-xs text-gray-400 flex items-center">
                        Tambah <span className="text-white ml-1">{editMode.toUpperCase()}</span>
                    </h3>
                    <form onSubmit={handleAddNode} className="space-y-3">
                        {editMode === 'customer' ? (
                            <select className="w-full p-2.5 text-sm bg-gray-800 border border-gray-700 text-white rounded outline-none focus:border-blue-500"
                                value={formData.customer_id} onChange={(e) => handleCustomerSelect(e.target.value)}>
                                <option value="">Pilih Pelanggan...</option>
                                {customers.filter(c => !nodes.some(n => n.customer_id === c.id)).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input type="text" placeholder="Nama Perangkat..." required className="w-full p-2.5 text-sm bg-gray-800 border border-gray-700 text-white rounded outline-none focus:border-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        )}
                        
                        <select className="w-full p-2.5 text-sm bg-gray-800 border border-gray-700 text-white rounded outline-none focus:border-blue-500" value={formData.parent_id} onChange={(e) => setFormData({...formData, parent_id: e.target.value})}>
                            <option value="">Hubungkan ke Uplink...</option>
                            {nodes.filter(n => editMode === 'customer' ? n.type === 'odp' : editMode === 'odp' ? n.type === 'odc' : n.type === 'server').map(n => (
                                <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                        </select>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button type="button" onClick={() => {setTempCoords(null); setEditMode(null);}} className="p-2.5 text-xs font-bold bg-gray-700 text-white rounded hover:bg-gray-600 transition">Batal</button>
                            <button type="submit" disabled={actionLoading} className="p-2.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-500 transition disabled:opacity-50">
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto"/> : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SIDE PANEL EDITOR */}
            <div className={`absolute top-0 right-0 h-full w-96 bg-[#1f2937] shadow-2xl z-[1001] transform transition-transform duration-300 ease-in-out border-l border-gray-700 flex flex-col ${activeNode ? 'translate-x-0' : 'translate-x-full'}`}>
                {activeNode && (
                    <>
                        <div className="p-5 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">{activeNode.name}</h2>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">Status: <span className={activeNode.status === 'los' ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{activeNode.status.toUpperCase()}</span></p>
                            </div>
                            <button onClick={() => setActiveNode(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 flex items-center">
                                    <Zap className="w-3 h-3 mr-1" /> Mikrotik Status <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 font-mono">DEMO</span>
                                </label>
                                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-2 gap-4 opacity-70">
                                    <div><div className="text-gray-500 text-[10px] uppercase">Uptime</div><div className="font-bold text-gray-200 text-sm">2d 14h</div></div>
                                    <div><div className="text-gray-500 text-[10px] uppercase">Ping</div><div className="font-bold text-green-400 text-sm">5ms</div></div>
                                </div>
                            </div>

                            <form onSubmit={handleSavePanel} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Informasi</label>
                                    <div className="space-y-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                        <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-blue-500 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                        <div className="text-[10px] text-gray-500 font-mono">ID: {activeNode.id}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Topology</label>
                                    <div className="space-y-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                        <select className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm outline-none" value={formData.parent_id} onChange={(e) => setFormData({...formData, parent_id: e.target.value})}>
                                            <option value="">Pilih Node Parent...</option>
                                            {nodes.filter(n => n.id !== activeNode.id).map(n => (
                                                <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-gray-500 mb-1">Port</label>
                                                <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm outline-none" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">Warna Kabel</label>
                                                <input type="color" className="h-9 w-12 bg-transparent border-0 cursor-pointer" value={formData.cable_color} onChange={(e) => setFormData({...formData, cable_color: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col gap-2">
                                    <button type="submit" disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center items-center disabled:opacity-50">
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Simpan Perubahan'}
                                    </button>
                                    <button type="button" onClick={handleDeleteNode} className="w-full border border-red-500/50 text-red-400 hover:bg-red-900/30 font-bold py-2.5 rounded-xl transition text-sm">Hapus Titik</button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* MAP CANVAS */}
            <div className={`w-full h-full transition-all duration-300 ${activeNode ? 'mr-96' : ''}`}>
                <MapContainer center={[-8.1724, 113.6995]} zoom={15} style={{ height: '100%', width: '100%', background: '#111827' }} zoomControl={false}>
                    <TileLayer url={getTileLayer()} attribution="&copy; NetBilling" />
                    <MapClickHandler active={editMode !== null} onMapClick={setTempCoords} />

                    {/* Coverage Area */}
                    {visibleNodes.filter(n => n.type === 'odp').map(odp => (
                        <Circle key={`cov-${odp.id}`} center={[parseFloat(odp.lat), parseFloat(odp.lng)]} radius={150} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1, dashArray: '4' }} />
                    ))}

                    {/* Garis Kabel (Edges) */}
                    {edges.map(edge => {
                        const fromNode = nodes.find(n => n.id === edge.from_node_id);
                        const toNode = nodes.find(n => n.id === edge.to_node_id);
                        if (!fromNode || !toNode) return null;
                        
                        return (
                            <Polyline 
                                key={`edge-${edge.id}`}
                                positions={[[parseFloat(fromNode.lat), parseFloat(fromNode.lng)], [parseFloat(toNode.lat), parseFloat(toNode.lng)]]} 
                                color={edge.cable_color || (edge.type === 'Backbone' ? '#10b981' : '#8b5cf6')} 
                                weight={3} 
                                opacity={0.7}
                            >
                                <Tooltip sticky>{edge.type} Link {edge.label && `(${edge.label})`}</Tooltip>
                            </Polyline>
                        );
                    })}

                    {/* Marker Titik Jaringan */}
                    {visibleNodes.map(node => (
                        <Marker 
                            key={node.id} 
                            position={[parseFloat(node.lat), parseFloat(node.lng)]} 
                            icon={getIcon(node.type, node.status)}
                            draggable={!isMapLocked && isAdminOrPemilik}
                            eventHandlers={{
                                dragend: (e) => handleDragEnd(e, node.id),
                                click: () => openEditPanel(node)
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[180px]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-black text-gray-800 uppercase text-[11px] tracking-wider">{node.name}</h3>
                                            <span className="text-[9px] text-blue-500 font-bold uppercase">{node.type}</span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${node.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {node.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="space-y-1 border-t border-gray-100 pt-1.5 text-[10px]">
                                        {node.customer && <p className="text-blue-600 font-bold">Paket: {node.customer.package_name}</p>}
                                        <p className="text-gray-500 italic">{node.description || 'N/A'}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapNetwork;