import { useState, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
    Plus, ChevronRight, Filter, Activity, Server, Thermometer, Database, 
    Lock, Unlock, Layers, X, Navigation, GripHorizontal, Share2, Wifi, 
    ChevronDown, Globe, Clock, Trash2, Zap, Loader2, Check, AlertTriangle, 
    User, HardDrive, Info, ShieldAlert
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// === HELPER STATUS DINAMIS JARINGAN ===
const getNodeStatus = (node, liveData) => {
    if (!node) return 'unknown';

    // 1. Blast Radius Check (Terdampak Pemadaman) - Prioritas Utama
    const isAffected = liveData?.blast_radius?.affected_nodes?.includes(node.id);
    if (isAffected) {
        return 'affected';
    }

    // 2. NOC Health Check (untuk server & odc)
    if (node.type === 'server' || node.type === 'odc') {
        const nodeLive = liveData?.noc_health?.[node.id];
        return nodeLive?.status || node.status || 'offline';
    }

    // 3. Pelanggan (customer)
    if (node.type === 'customer') {
        const custLive = liveData?.customer_statuses?.[node.customer_id] || {};
        const isIsolir = custLive.is_isolir || node.customer?.status === 'terisolir';
        if (isIsolir) {
            return 'isolir';
        }

        const ticketLive = liveData?.active_tickets?.[node.customer_id];
        if (ticketLive) {
            return 'gangguan';
        }

        const radiusLive = liveData?.radius_sessions?.sessions?.find(
            s => s.username === node.name || s.ip_address === node.customer?.ip_address
        );
        if (radiusLive?.is_online) {
            return 'online';
        }

        return 'offline'; // default offline jika tidak terdeteksi online
    }

    // 4. ODP (Splitter)
    if (node.type === 'odp') {
        return node.status || 'aktif';
    }

    return node.status || 'unknown';
};

const getNodeStatusColorClass = (status, nodeType) => {
    switch (status) {
        case 'online':
        case 'aktif':
            return 'bg-green-900/50 text-green-400 border border-green-500/30';
        case 'warning':
        case 'gangguan':
            return 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30';
        case 'isolir':
            return 'bg-red-900/50 text-red-400 border border-red-500/30';
        case 'offline':
        case 'los':
            return nodeType === 'customer'
                ? 'bg-gray-900/50 text-gray-400 border border-gray-500/30'
                : 'bg-red-900/50 text-red-500 border border-red-500/30';
        case 'affected':
            return 'bg-gray-800 text-gray-400 border border-gray-600';
        default:
            return 'bg-gray-900/50 text-gray-400';
    }
};

const getNodeStatusTextColor = (status, nodeType) => {
    switch (status) {
        case 'online':
        case 'aktif':
            return 'text-green-400 font-bold';
        case 'warning':
        case 'gangguan':
            return 'text-yellow-400 font-bold';
        case 'isolir':
            return 'text-red-400 font-bold';
        case 'offline':
        case 'los':
            return nodeType === 'customer'
                ? 'text-gray-400 font-bold'
                : 'text-red-500 font-bold';
        case 'affected':
            return 'text-gray-500 font-bold';
        default:
            return 'text-gray-400';
    }
};

// === KONFIGURASI IKON SPESIFIK (V4 - DYNAMIC LIVE STATUS) ===
const getIcon = (type, node, liveData, filterMode) => {
    let iconHtml = '';
    const status = getNodeStatus(node, liveData);
    const custLive = liveData?.customer_statuses?.[node.customer_id] || {};
    const radiusLive = liveData?.radius_sessions?.sessions?.find(s => s.username === node.name || s.ip_address === node.customer?.ip_address);
    const ticketLive = liveData?.active_tickets?.[node.customer_id];
    const capacity = liveData?.odp_capacity?.[node.id];

    // Status Warna Perangkat (NOC & Dinamis)
    let statusColor = 'text-gray-400';
    let borderClass = 'border-gray-700';
    let glowClass = '';

    if (status === 'online' || status === 'aktif') {
        statusColor = 'text-green-400';
        borderClass = 'border-green-500/50';
        glowClass = 'shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    } else if (status === 'warning' || status === 'gangguan') {
        statusColor = 'text-yellow-400';
        borderClass = 'border-yellow-500/50';
        glowClass = 'shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    } else if (status === 'offline' || status === 'los') {
        if (type === 'customer') {
            statusColor = 'text-gray-400';
            borderClass = 'border-gray-700';
            glowClass = '';
        } else {
            statusColor = 'text-red-500';
            borderClass = 'border-red-500';
            glowClass = 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]';
        }
    } else if (status === 'affected') {
        borderClass = 'border-gray-600 opacity-40 grayscale';
        glowClass = '';
        statusColor = 'text-gray-500';
    } else if (status === 'isolir') {
        statusColor = 'text-red-400';
        borderClass = 'border-red-500/50';
        glowClass = 'shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    }

    // Highlight Isolir Filter
    const isIsolir = status === 'isolir';
    if (filterMode === 'isolir' && !isIsolir) {
        borderClass += ' opacity-20';
    }

    if (type === 'server') {
        const pulseRing = status === 'offline' ? '<div class="absolute -inset-1.5 rounded-lg animate-ping border-2 border-red-500/40 opacity-75 pointer-events-none"></div>' : '';
        iconHtml = `<div class="relative bg-gray-900 border-2 ${borderClass} rounded-lg p-1.5 ${glowClass} flex items-center justify-center">
            ${pulseRing}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${statusColor}"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
        </div>`;
    } else if (type === 'odc') {
        const pulseRing = status === 'offline' ? '<div class="absolute -inset-1.5 rounded-lg animate-ping border-2 border-red-500/40 opacity-75 pointer-events-none"></div>' : '';
        iconHtml = `<div class="relative bg-gray-900 border-2 ${borderClass} rounded-lg p-1.5 ${glowClass} flex items-center justify-center">
            ${pulseRing}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${statusColor}"><path d="M4 9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.5"/><path d="M8.5 9v5.5a2.5 2.5 0 0 0 5 0V9"/><path d="M12.5 14.5v5.5a2 2 0 0 1-2-2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2z"/></svg>
            ${status === 'offline' ? '<div class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>' : ''}
        </div>`;
    } else if (type === 'odp') {
        const capClass = capacity?.is_full ? 'bg-red-900/80 text-red-200 border-red-500' : capacity?.percent > 70 ? 'bg-orange-900/80 text-orange-200 border-orange-500' : 'bg-gray-800 text-gray-400 border-gray-700';
        iconHtml = `<div class="relative bg-gray-900 border-2 ${borderClass} rounded-lg p-1 ${glowClass} flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${statusColor}"><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18H6"/><path d="M10.01 18H10"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/></svg>
            ${capacity ? `<div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1 rounded text-[8px] font-bold border ${capClass}">${capacity.used}/${capacity.max}</div>` : ''}
        </div>`;
    } else {
        // Pelanggan
        const dotColor = radiusLive?.is_online ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-gray-500';
        const isolirIcon = isIsolir ? '<div class="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 border border-gray-900"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' : '';
        const ticketBadge = ticketLive ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' : '';
        const pulseRing = isIsolir 
            ? '<div class="absolute -inset-1 rounded-full animate-ping border border-red-500/40 opacity-75 pointer-events-none"></div>'
            : (ticketLive 
                ? '<div class="absolute -inset-1 rounded-full animate-ping border border-yellow-500/40 opacity-75 pointer-events-none"></div>'
                : '');
        
        iconHtml = `<div class="relative bg-gray-800 border ${isIsolir ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : borderClass} rounded-full p-1 shadow-lg flex items-center justify-center">
            ${pulseRing}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isIsolir ? 'text-red-400' : statusColor}"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${dotColor} rounded-full border border-gray-900"></div>
            ${isolirIcon}
            ${ticketBadge}
        </div>`;
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
    const [liveData, setLiveData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchLiveData = useCallback(async () => {
        try {
            const res = await api.get('/network/map-live');
            if (res.data.success) {
                setLiveData(res.data);
            }
        } catch (err) {
            console.error('Gagal mengambil live data:', err);
        }
    }, []);

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
            await fetchLiveData();
        } catch (err) {
            showToast('Gagal mengambil data jaringan', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchLiveData, 10000); // Polling 10 detik
        return () => clearInterval(interval);
    }, [fetchLiveData]);

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
    const [formData, setFormData] = useState({ name: '', parent_id: '', package: '10 Mbps', cable_color: '#3b82f6', port: '', customer_id: '', max_ports: 8 });

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
            customer_id: node.customer_id || '',
            max_ports: node.max_ports || 8
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
        if (filterMode === 'los') return nodes.filter(n => {
            if (n.type !== 'customer') return true;
            const status = getNodeStatus(n, liveData);
            return status === 'offline' || status === 'los' || status === 'gangguan';
        });
        if (filterMode === 'isolir') return nodes.filter(n => {
            if (n.type !== 'customer') return true;
            const status = getNodeStatus(n, liveData);
            return status === 'isolir';
        });
        return nodes;
    }, [nodes, filterMode, liveData]);

    const getTileLayer = () => {
        if (mapTheme === 'dark') return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
        if (mapTheme === 'hybrid') return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    };

    if (loading) {
        return <LoadingSpinner fullScreen={true} text="Menghubungkan ke topologi jaringan..." />;
    }

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

            {/* WIDGET RESOURCE (Kiri Atas) - Integrated with Live Data */}
            <div className="absolute top-6 left-6 z-[1000] dark-glass-panel rounded-xl p-4 shadow-2xl text-white text-xs font-mono w-64 pointer-events-none">
                <div className="flex items-center justify-between border-b border-gray-600 pb-3 mb-3">
                    <span className="font-bold flex items-center text-sm"><Server className="w-4 h-4 mr-2 text-blue-400"/> NOC MONITOR <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{liveData?.noc_health ? 'LIVE' : 'DEMO'}</span></span>
                    <span className={`font-bold flex items-center px-2 py-1 rounded ${liveData?.noc_health ? 'text-green-400 bg-green-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${liveData?.noc_health ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span> {liveData?.noc_health ? 'CONNECTED' : 'STANDBY'}
                    </span>
                </div>
                <div className="space-y-3 opacity-75">
                    {/* Mengambil data dari server utama pertama */}
                    {Object.values(liveData?.noc_health || {}).filter(n => n.cpu_load !== null).map((n, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300">CPU Load</span><span className="font-bold text-white">{n.cpu_load}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full"><div className="bg-blue-400 h-1.5 rounded-full" style={{width: `${n.cpu_load}%`}}></div></div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-gray-300">Uptime</span><span className="font-bold text-white">{n.uptime || 'N/A'}</span>
                            </div>
                        </div>
                    )).slice(0, 1)}
                    
                    {!liveData?.noc_health && (
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300">System Load</span><span className="font-bold text-white">--</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full"><div className="bg-blue-400 h-1.5 rounded-full" style={{width: '0%'}}></div></div>
                        </div>
                    )}
                    
                    <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Radius Users</span><span className="font-bold text-green-400">{liveData?.radius_sessions?.sessions?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAP LEGEND (Kiri Bawah) */}
            <div className="absolute bottom-6 left-6 z-[1000] dark-glass-panel p-3 rounded-xl shadow-2xl border border-gray-700 flex flex-col gap-2">
                <h3 className="text-[10px] font-bold text-gray-400 mb-1 flex items-center uppercase tracking-widest"><Globe className="w-3 h-3 mr-1 text-blue-400"/> Network Legend</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-300">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Online</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Warning</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Offline</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-gray-500 rounded-full"></span> Affected</div>
                    <div className="flex items-center gap-1.5 text-red-400"><Lock className="w-2.5 h-2.5"/> Isolir</div>
                    <div className="flex items-center gap-1.5 text-yellow-400"><AlertTriangle className="w-2.5 h-2.5"/> Ticket</div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-700">
                    <h3 className="text-[10px] font-bold text-gray-400 mb-2 flex items-center uppercase tracking-widest"><Filter className="w-3 h-3 mr-1 text-blue-400"/> Filters</h3>
                    <div className="relative">
                        <select 
                            className="text-[10px] border border-gray-600 rounded p-1.5 pr-6 appearance-none bg-gray-800 text-white font-semibold outline-none focus:border-blue-500 w-full cursor-pointer transition-colors"
                            value={filterMode} 
                            onChange={e => setFilterMode(e.target.value)}
                        >
                            <option value="all">Tampilkan Seluruh Titik</option>
                            <option value="backbone">Sembunyikan Pelanggan</option>
                            <option value="los">⚠️ Pelanggan LOS Saja</option>
                            <option value="isolir">🔒 Pelanggan Isolir</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* TOOLBAR KANAN ATAS */}
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
                        Tambah <span className="text-white ml-1">{(editMode || '').toUpperCase()}</span>
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

                        {editMode === 'odp' && (
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">Kapasitas Port</label>
                                <input type="number" placeholder="8" className="w-full p-2.5 text-sm bg-gray-800 border border-gray-700 text-white rounded outline-none focus:border-blue-500" value={formData.max_ports} onChange={(e) => setFormData({...formData, max_ports: e.target.value})} />
                            </div>
                        )}

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
                                <p className="text-xs text-gray-400 font-mono mt-0.5">Status: <span className={getNodeStatusTextColor(getNodeStatus(activeNode, liveData), activeNode.type)}>{(getNodeStatus(activeNode, liveData) || 'UNKNOWN').toUpperCase()}</span></p>
                            </div>
                            <button onClick={() => setActiveNode(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                            {/* 1. NOC Health Metrics for server and odc */}
                            {(activeNode.type === 'server' || activeNode.type === 'odc') && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 flex items-center">
                                        <Zap className="w-3 h-3 mr-1" /> Live Health Metrics <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 font-mono">NOC</span>
                                    </label>
                                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Uptime</div>
                                            <div className="font-bold text-gray-200 text-sm">{liveData?.noc_health?.[activeNode.id]?.uptime || 'Unknown'}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> Latency</div>
                                            <div className={`font-bold text-sm ${liveData?.noc_health?.[activeNode.id]?.latency > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {liveData?.noc_health?.[activeNode.id]?.latency ? `${liveData?.noc_health?.[activeNode.id]?.latency}ms` : '---'}
                                            </div>
                                        </div>
                                        {liveData?.noc_health?.[activeNode.id]?.cpu_load !== null && liveData?.noc_health?.[activeNode.id]?.cpu_load !== undefined && (
                                            <div className="col-span-2">
                                                <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1"><HardDrive className="w-3 h-3"/> CPU Load</div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-blue-500 h-full" style={{width: `${liveData?.noc_health?.[activeNode.id]?.cpu_load}%`}}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-blue-400">{liveData?.noc_health?.[activeNode.id]?.cpu_load}%</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 2. GPON ONU Health for Customer */}
                            {activeNode.type === 'customer' && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 flex items-center">
                                        <Zap className="w-3 h-3 mr-1 text-green-400" /> GPON ONU Optical Health <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 font-mono">OLT LINK</span>
                                    </label>
                                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Thermometer className="w-3 h-3"/> Optical Power</div>
                                            <div className={`font-bold text-sm ${parseFloat(liveData?.gpon_health?.[activeNode.id]?.rx_power) < -27 ? 'text-red-500' : parseFloat(liveData?.gpon_health?.[activeNode.id]?.rx_power) < -25 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {liveData?.gpon_health?.[activeNode.id]?.rx_power || '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Info className="w-3 h-3"/> ONU State</div>
                                            <div className="font-bold text-gray-200 text-xs">
                                                {liveData?.gpon_health?.[activeNode.id]?.onu_state || 'Unknown'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> Latency to ONU</div>
                                            <div className="font-bold text-gray-200 text-sm">
                                                {liveData?.gpon_health?.[activeNode.id]?.latency || '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Share2 className="w-3 h-3"/> Drop Distance</div>
                                            <div className="font-bold text-gray-200 text-sm">
                                                {liveData?.gpon_health?.[activeNode.id]?.distance_m ? `${liveData?.gpon_health?.[activeNode.id]?.distance_m} m` : '---'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. ODP Health for ODP Splitter */}
                            {activeNode.type === 'odp' && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center">
                                        <Zap className="w-3 h-3 mr-1 text-blue-400" /> ODP Splitter Health <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 font-mono">OPTICAL</span>
                                    </label>
                                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Thermometer className="w-3 h-3"/> Optical Input</div>
                                            <div className="font-bold text-green-400 text-sm">
                                                {liveData?.gpon_health?.[activeNode.id]?.optical_input || '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Info className="w-3 h-3"/> Splitter Loss</div>
                                            <div className="font-bold text-yellow-400 text-sm">
                                                {liveData?.gpon_health?.[activeNode.id]?.splitter_loss || '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Share2 className="w-3 h-3"/> Distance to ODC</div>
                                            <div className="font-bold text-gray-200 text-sm">
                                                {liveData?.gpon_health?.[activeNode.id]?.distance_odc_m ? `${liveData?.gpon_health?.[activeNode.id]?.distance_odc_m} m` : '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> Optical Output</div>
                                            <div className="font-bold text-green-400 text-sm">
                                                {liveData?.gpon_health?.[activeNode.id]?.optical_output || '---'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Client Session Info for Customers */}
                            {activeNode.type === 'customer' && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center">
                                        <Globe className="w-3 h-3 mr-1" /> Radius Session <span className="ml-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 font-mono">LIVE</span>
                                    </label>
                                    {liveData?.radius_sessions?.sessions?.find(s => s.username === activeNode.name || s.ip_address === activeNode.customer?.ip_address) ? (
                                        <div className="bg-gray-800 rounded-xl p-4 border border-purple-500/30 grid grid-cols-2 gap-4">
                                            <div className="col-span-2 text-green-400 text-xs font-bold flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Online Session Active
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-[10px] uppercase">Download</div>
                                                <div className="font-bold text-blue-400 text-sm">
                                                    {liveData?.radius_sessions?.sessions?.find(s => s.username === activeNode.name || s.ip_address === activeNode.customer?.ip_address)?.download_mb} MB
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-[10px] uppercase">Upload</div>
                                                <div className="font-bold text-orange-400 text-sm">
                                                    {liveData?.radius_sessions?.sessions?.find(s => s.username === activeNode.name || s.ip_address === activeNode.customer?.ip_address)?.upload_mb} MB
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center text-gray-500 text-xs italic">
                                            Client currently offline
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSavePanel} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Informasi</label>
                                    <div className="space-y-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                        <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-blue-500 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                        <div className="text-[10px] text-gray-500 font-mono">ID: {activeNode.id}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Topology & Config</label>
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
                                            {activeNode.type === 'odp' && (
                                                <div className="flex-1">
                                                    <label className="block text-[10px] text-gray-500 mb-1">Max Ports</label>
                                                    <input type="number" className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm outline-none" value={formData.max_ports} onChange={(e) => setFormData({...formData, max_ports: e.target.value})} />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-1">Kabel</label>
                                                <input type="color" className="h-9 w-12 bg-transparent border-0 cursor-not-allowed opacity-50" value={formData.cable_color} disabled />
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
                <MapContainer center={[-8.1680, 113.6790]} zoom={14} style={{ height: '100%', width: '100%', background: '#111827' }} zoomControl={false}>
                    <TileLayer url={getTileLayer()} attribution="&copy; NetBilling" />
                    <MapClickHandler active={editMode !== null} onMapClick={setTempCoords} />

                    {/* Coverage Area */}
                    {visibleNodes.filter(n => n.type === 'odp').map(odp => (
                        <Circle key={`cov-${odp.id}`} center={[parseFloat(odp.lat), parseFloat(odp.lng)]} radius={150} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1, dashArray: '4' }} />
                    ))}

                    {/* Blast Radius Visualizer */}
                    {liveData?.blast_radius?.affected_nodes?.length > 0 && liveData.blast_radius.offline_parents.map(parentId => {
                        const parent = nodes.find(n => n.id === parentId);
                        if (!parent) return null;
                        return (
                            <Circle 
                                key={`blast-${parentId}`}
                                center={[parseFloat(parent.lat), parseFloat(parent.lng)]} 
                                radius={400} 
                                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2, dashArray: '10 10', className: 'blast-circle' }} 
                            >
                                <Tooltip sticky>Zona Dampak Pemadaman ({parent.name})</Tooltip>
                            </Circle>
                        );
                    })}

                    {/* Garis Kabel (Edges) */}
                    {edges.map(edge => {
                        const fromNode = nodes.find(n => n.id === edge.from_node_id);
                        const toNode = nodes.find(n => n.id === edge.to_node_id);
                        if (!fromNode || !toNode) return null;
                        
                        // Cek status node tujuan untuk menentukan warna dan animasi garis
                        const toStatus = getNodeStatus(toNode, liveData);
                        const toNodeRadius = liveData?.radius_sessions?.sessions?.find(s => s.username === toNode.name || s.ip_address === toNode.customer?.ip_address);
                        
                        const isIsolir = toStatus === 'isolir';
                        const isOffline = toStatus === 'offline' || toStatus === 'los';
                        const isWarning = toStatus === 'warning' || toStatus === 'gangguan';
                        const isAffected = toStatus === 'affected';
                        const isHeavy = toNodeRadius?.is_heavy;
                        const isOnline = toStatus === 'online' || toStatus === 'aktif';

                        let lineClass = '';
                        let lineColor = edge.cable_color || (edge.type === 'Backbone' ? '#10b981' : '#8b5cf6');
                        
                        if (isOffline || isAffected) {
                            lineClass = 'line-offline';
                            lineColor = '#9ca3af'; // gray
                        } else if (isIsolir || isWarning) {
                            lineClass = 'line-danger';
                            lineColor = '#ef4444'; // red
                        } else if (isHeavy) {
                            lineClass = 'heavy-traffic-edge';
                            lineColor = '#22c55e'; // green
                        } else if (isOnline) {
                            lineClass = 'line-online';
                            lineColor = '#22c55e'; // green
                        }

                        return (
                            <Polyline 
                                key={`edge-${edge.id}-${lineClass}`}
                                positions={[[parseFloat(fromNode.lat), parseFloat(fromNode.lng)], [parseFloat(toNode.lat), parseFloat(toNode.lng)]]} 
                                color={lineColor}
                                weight={isHeavy ? 5 : 3}
                                className={lineClass}
                            >
                                <Tooltip sticky>
                                    <div className="p-1">
                                        <p className="font-bold text-[10px]">{edge.type} Link</p>
                                        {isHeavy && <p className="text-blue-400 font-bold text-[9px] animate-pulse">HEAVY TRAFFIC DETECTED</p>}
                                        {isAffected && <p className="text-red-400 font-bold text-[9px]">OUTAGE AREA</p>}
                                        {isIsolir && <p className="text-red-400 font-bold text-[9px]">TERISOLIR</p>}
                                        {isWarning && <p className="text-yellow-400 font-bold text-[9px]">WARNING / TICKET</p>}
                                    </div>
                                </Tooltip>
                            </Polyline>
                        );
                    })}

                    {/* Marker Titik Jaringan */}
                    {visibleNodes.map(node => (
                        <Marker 
                            key={node.id} 
                            position={[parseFloat(node.lat), parseFloat(node.lng)]} 
                            icon={getIcon(node.type, node, liveData, filterMode)}
                            draggable={!isMapLocked && isAdminOrPemilik}
                            eventHandlers={{
                                dragend: (e) => handleDragEnd(e, node.id),
                                click: () => openEditPanel(node)
                            }}
                        >
                            <Popup className="metrics-popup">
                                <div className="p-1 min-w-[220px]">
                                    <div className="flex justify-between items-center mb-2.5 border-b border-gray-700/60 pb-2">
                                        <div>
                                            <h3 className="font-extrabold text-white uppercase text-xs tracking-wider">{node.name}</h3>
                                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">{node.type}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${getNodeStatusColorClass(getNodeStatus(node, liveData), node.type)}`}>
                                            {(getNodeStatus(node, liveData) || 'UNKNOWN').toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Bento Grid */}
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {node.type !== 'customer' ? (
                                            <>
                                                <div className="bg-gray-800/80 border border-gray-700/50 p-2 rounded-lg flex flex-col justify-between shadow-inner">
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-green-400"/> Latency</span>
                                                    <span className="text-[11px] font-black text-green-400 mt-1">{liveData?.noc_health?.[node.id]?.latency ? `${liveData?.noc_health?.[node.id]?.latency}ms` : '---'}</span>
                                                </div>
                                                <div className="bg-gray-800/80 border border-gray-700/50 p-2 rounded-lg flex flex-col justify-between shadow-inner">
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold flex items-center gap-1"><HardDrive className="w-2.5 h-2.5 text-blue-400"/> CPU Load</span>
                                                    <span className="text-[11px] font-black text-blue-400 mt-1">{liveData?.noc_health?.[node.id]?.cpu_load !== null && liveData?.noc_health?.[node.id]?.cpu_load !== undefined ? `${liveData?.noc_health?.[node.id]?.cpu_load}%` : '---'}</span>
                                                </div>
                                                {node.type === 'odp' && liveData?.odp_capacity?.[node.id] && (
                                                    <div className="col-span-2 bg-gray-800/80 border border-gray-700/50 p-2 rounded-lg flex justify-between items-center shadow-inner">
                                                        <span className="text-[8px] text-gray-500 uppercase font-bold flex items-center gap-1"><Wifi className="w-2.5 h-2.5 text-purple-400"/> Port Capacity</span>
                                                        <span className={`text-[10px] font-extrabold ${liveData?.odp_capacity?.[node.id]?.is_full ? 'text-red-400' : 'text-gray-200'}`}>
                                                            {liveData?.odp_capacity?.[node.id]?.used} / {liveData?.odp_capacity?.[node.id]?.max}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {/* Customer Bento Card */}
                                                <div className="col-span-2 bg-gray-800/80 border border-gray-700/50 p-2 rounded-lg shadow-inner space-y-1">
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-yellow-400"/> Layanan</span>
                                                    <p className="text-[11px] text-white font-extrabold">{node.customer?.package_name || 'N/A'}</p>
                                                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">{node.customer?.ip_address || 'No IP Configured'}</p>
                                                </div>

                                                {/* Status Alerts */}
                                                {(liveData?.customer_statuses?.[node.customer_id]?.is_isolir || liveData?.active_tickets?.[node.customer_id]) && (
                                                    <div className="col-span-2 space-y-1.5">
                                                        {liveData?.customer_statuses?.[node.customer_id]?.is_isolir && (
                                                            <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-1.5 rounded-lg flex items-center gap-1.5 font-bold text-[9px] shadow-sm animate-pulse">
                                                                <Lock className="w-3 h-3 text-red-400 flex-shrink-0"/> TERISOLIR (MENUNGGAK)
                                                            </div>
                                                        )}
                                                        {liveData?.active_tickets?.[node.customer_id] && (
                                                            <div className="bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 p-1.5 rounded-lg flex items-center gap-1.5 font-bold text-[9px] shadow-sm animate-pulse">
                                                                <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0"/> TICKET: {(liveData?.active_tickets?.[node.customer_id]?.priority || '').toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Bandwidth Usage if Online */}
                                                {liveData?.radius_sessions?.sessions?.find(s => s.username === node.name || s.ip_address === node.customer?.ip_address) ? (
                                                    (() => {
                                                        const rad = liveData?.radius_sessions?.sessions?.find(s => s.username === node.name || s.ip_address === node.customer?.ip_address);
                                                        return (
                                                            <>
                                                                <div className="bg-gray-800/80 border border-gray-700/50 p-2 rounded-lg flex flex-col justify-between shadow-inner">
                                                                    <span className="text-[8px] text-gray-500 uppercase font-bold">Download</span>
                                                                    <span className="text-[10px] font-black text-green-400 mt-0.5">{rad.download_mb >= 1000 ? `${(rad.download_mb/1024).toFixed(2)} GB` : `${rad.download_mb} MB`}</span>
                                                                </div>
                                                                <div className="bg-gray-800/80 border border-gray-700/50 p-2 rounded-lg flex flex-col justify-between shadow-inner">
                                                                    <span className="text-[8px] text-gray-500 uppercase font-bold">Upload</span>
                                                                    <span className="text-[10px] font-black text-blue-400 mt-0.5">{rad.upload_mb >= 1000 ? `${(rad.upload_mb/1024).toFixed(2)} GB` : `${rad.upload_mb} MB`}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()
                                                ) : (
                                                    <div className="col-span-2 bg-gray-900/30 border border-gray-800/80 p-2 rounded-lg text-center text-gray-500 text-[9px] font-semibold italic">
                                                        Pelanggan tidak memiliki sesi aktif
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-2.5 pt-2 border-t border-gray-700/60 text-[9px] text-gray-500 flex items-center justify-center gap-1">
                                        <Info className="w-2.5 h-2.5 text-blue-500"/> Klik marker untuk membuka Editor
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