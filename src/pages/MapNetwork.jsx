import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Plus, ChevronRight, Edit2, Trash2, Filter, Activity, Wifi } from 'lucide-react';

// === KONFIGURASI IKON ===
const getIcon = (type, status) => {
    let url = 'https://cdn-icons-png.flaticon.com/512/684/684908.png';
    if (type === 'server') url = 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'; // Server Hitam
    if (type === 'odc') url = 'https://cdn-icons-png.flaticon.com/512/9431/9431186.png'; // Kotak ODC
    if (type === 'odp') url = 'https://cdn-icons-png.flaticon.com/512/2991/2991231.png'; // ODP
    if (type === 'customer') url = 'https://cdn-icons-png.flaticon.com/512/619/619153.png'; // Rumah biru
    if (status === 'LOS') url = 'https://cdn-icons-png.flaticon.com/512/1214/1214428.png'; // Rumah Merah (Danger)

    return new L.Icon({
        iconUrl: url,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
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
    
    // State Utama Jaringan dengan Metrik Enterprise Tambahan
    const [nodes, setNodes] = useState([
        { id: 'SVR-01', name: 'NOC Pusat Jember', type: 'server', lat: -8.1724, lng: 113.6995, parent: null, status: 'Aktif' },
        { id: 'ODC-01', name: 'ODC Patrang', type: 'odc', lat: -8.1650, lng: 113.7050, parent: 'SVR-01', status: 'Aktif' },
        { id: 'ODP-01', name: 'ODP Mastrip 1', type: 'odp', lat: -8.1685, lng: 113.7025, parent: 'ODC-01', status: 'Aktif', portUsage: '5/8 Port' },
        { id: 'ODP-02', name: 'ODP Mastrip 2', type: 'odp', lat: -8.1670, lng: 113.6950, parent: 'ODC-01', status: 'Aktif', portUsage: '8/8 Port (Penuh)' },
        { id: 'CUST-01', name: 'Budi Santoso', type: 'customer', lat: -8.1691, lng: 113.7020, parent: 'ODP-01', package: '20 Mbps', phone: '0812345', status: 'Aktif', rxPower: '-19.5 dBm' },
        { id: 'CUST-02', name: 'Siti Aminah', type: 'customer', lat: -8.1675, lng: 113.7030, parent: 'ODP-01', package: '10 Mbps', phone: '0822233', status: 'LOS', rxPower: '-32.1 dBm' },
        { id: 'CUST-03', name: 'Toko Makmur', type: 'customer', lat: -8.1660, lng: 113.6940, parent: 'ODP-02', package: '50 Mbps', phone: '0833344', status: 'Aktif', rxPower: '-26.8 dBm' },
    ]);

    // State Editor & Filter
    const [editMode, setEditMode] = useState(null);
    const [isUpdating, setIsUpdating] = useState(null);
    const [tempCoords, setTempCoords] = useState(null);
    const [formData, setFormData] = useState({ name: '', parent: '', package: '10 Mbps', phone: '', address: '' });
    
    // Fitur Filter Peta
    const [filterMode, setFilterMode] = useState('all');

    // Menghitung node yang dirender berdasarkan filter
    const visibleNodes = useMemo(() => {
        if (filterMode === 'backbone') return nodes.filter(n => n.type !== 'customer');
        if (filterMode === 'los') return nodes.filter(n => n.status === 'LOS' || n.type !== 'customer'); // Tampilkan LOS beserta backbone nya
        return nodes;
    }, [nodes, filterMode]);

    // Fungsi Warna Kabel Dinamis
    const getCableColor = (nodeType, nodeStatus) => {
        if (nodeStatus === 'LOS') return '#ef4444'; // Merah Putus
        if (nodeType === 'customer') return '#3b82f6'; // Biru Drop Core
        if (nodeType === 'odp') return '#8b5cf6'; // Ungu Distribusi
        return '#10b981'; // Hijau Core
    };

    const getCableClass = (nodeStatus) => {
        if (nodeStatus === 'LOS') return 'animate-pulse opacity-100';
        return 'opacity-60';
    };

    // Fungsi Simpan (Tambah Baru atau Update)
    const handleSave = (e) => {
        e.preventDefault();
        if (isUpdating) {
            setNodes(nodes.map(n => n.id === isUpdating ? { ...n, ...formData } : n));
            alert('Data berhasil diperbarui!');
        } else {
            const newNode = {
                id: `${editMode.toUpperCase()}-${Date.now()}`,
                type: editMode,
                lat: tempCoords.lat,
                lng: tempCoords.lng,
                ...formData,
                status: 'Aktif',
                rxPower: editMode === 'customer' ? '-20.0 dBm' : undefined
            };
            setNodes([...nodes, newNode]);
            alert('Titik baru berhasil ditambahkan!');
        }
        resetForm();
    };

    const handleDelete = (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus titik ini? Garis yang terhubung juga akan hilang.')) {
            setNodes(nodes.filter(n => n.id !== id));
        }
    };

    const startEdit = (node) => {
        setIsUpdating(node.id);
        setEditMode(node.type);
        setFormData({ name: node.name, parent: node.parent || '', package: node.package || '10 Mbps', phone: node.phone || '', address: node.address || '' });
        setTempCoords({ lat: node.lat, lng: node.lng });
    };

    const resetForm = () => {
        setEditMode(null);
        setIsUpdating(null);
        setTempCoords(null);
        setFormData({ name: '', parent: '', package: '10 Mbps', phone: '', address: '' });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Visualisasi Peta Jaringan (GIS)</h1>
                    <p className="text-gray-500 mt-1">Pemetaan letak Server, ODC, ODP, dan cakupan wilayah Pelanggan.</p>
                </div>

                {/* TOOLBAR EDITOR */}
                {(user?.role === 'pemilik' || user?.role === 'admin') && (
                    <div className="flex bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                        <button onClick={() => setEditMode('server')} className={`px-3 py-2 rounded flex items-center text-xs font-bold transition-all ${editMode === 'server' ? 'bg-red-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> Core
                        </button>
                        <button onClick={() => setEditMode('odc')} className={`px-3 py-2 rounded flex items-center text-xs font-bold transition-all ${editMode === 'odc' ? 'bg-orange-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> ODC
                        </button>
                        <button onClick={() => setEditMode('odp')} className={`px-3 py-2 rounded flex items-center text-xs font-bold transition-all ${editMode === 'odp' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> ODP
                        </button>
                        <button onClick={() => setEditMode('customer')} className={`px-3 py-2 rounded flex items-center text-xs font-bold transition-all ${editMode === 'customer' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> Rumah
                        </button>
                    </div>
                )}
            </div>

            <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                
                {/* PANEL FILTER PETA */}
                <div className="absolute top-4 left-14 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center uppercase tracking-wider"><Filter className="w-3 h-3 mr-1 text-blue-600"/> Filter Layer</h3>
                    <select 
                        className="text-sm border border-gray-300 rounded p-1.5 bg-white font-semibold text-gray-700 outline-none focus:border-blue-500 w-full"
                        value={filterMode} 
                        onChange={e => setFilterMode(e.target.value)}
                    >
                        <option value="all">Tampilkan Seluruh Titik</option>
                        <option value="backbone">Tampilkan Core & ODP Saja</option>
                        <option value="los">⚠️ Tampilkan Pelanggan LOS Saja</option>
                    </select>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 text-[10px] text-gray-500 space-y-1">
                        <div className="flex items-center"><span className="w-2 h-2 bg-[#8b5cf6] rounded-full mr-1"></span> Kabel Distribusi</div>
                        <div className="flex items-center"><span className="w-2 h-2 bg-[#3b82f6] rounded-full mr-1"></span> Kabel Drop Core</div>
                        <div className="flex items-center"><span className="w-2 h-2 bg-[#ef4444] rounded-full mr-1 animate-pulse"></span> Kabel Putus (LOS)</div>
                    </div>
                </div>

                {/* FORM PANEL (Tambah/Edit) */}
                {(tempCoords || isUpdating) && (
                    <div className="absolute top-4 right-4 z-[1000] w-80 bg-white p-5 rounded-xl shadow-2xl border-t-4 border-blue-600 animate-slideIn">
                        <h3 className="font-bold mb-4 uppercase text-xs text-gray-500 flex items-center">
                            {isUpdating ? 'Edit Data' : 'Tambah Koordinat Baru'} <ChevronRight className="w-3 h-3 mx-1" /> <span className="text-blue-600">{editMode}</span>
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <input type="text" placeholder="Nama Titik..." required className="w-full p-2.5 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none font-semibold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            
                            {editMode === 'customer' && (
                                <select className="w-full p-2.5 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none" value={formData.package} onChange={(e) => setFormData({...formData, package: e.target.value})}>
                                    <option value="10 Mbps">Paket 10 Mbps</option>
                                    <option value="20 Mbps">Paket 20 Mbps</option>
                                    <option value="50 Mbps">Paket 50 Mbps</option>
                                </select>
                            )}

                            <select className="w-full p-2.5 text-sm border border-gray-300 rounded font-bold text-gray-700 focus:border-blue-500 outline-none" value={formData.parent} onChange={(e) => setFormData({...formData, parent: e.target.value})}>
                                <option value="">Hubungkan ke Uplink...</option>
                                {nodes.filter(n => n.id !== isUpdating && (editMode === 'customer' ? n.type === 'odp' : editMode === 'odp' ? n.type === 'odc' : n.type === 'server')).map(n => (
                                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="p-2 text-sm font-bold bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">Batal</button>
                                <button type="submit" className="p-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow">Simpan</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="h-[700px] w-full">
                    <MapContainer center={[-8.1724, 113.6995]} zoom={15} style={{ height: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                        <MapClickHandler active={editMode !== null && !isUpdating} onMapClick={setTempCoords} />

                        {/* Merender Lingkaran Cakupan ODP (Coverage Area Radius 150m) */}
                        {visibleNodes.filter(n => n.type === 'odp').map(odp => (
                            <Circle 
                                key={`cov-${odp.id}`} 
                                center={[odp.lat, odp.lng]} 
                                radius={150} 
                                pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.08, weight: 1, dashArray: '4' }} 
                            />
                        ))}

                        {/* Merender Marker Perangkat / Pelanggan */}
                        {visibleNodes.map(node => (
                            <div key={node.id}>
                                <Marker position={[node.lat, node.lng]} icon={getIcon(node.type, node.status)}>
                                    <Popup>
                                        <div className="p-2 min-w-[220px]">
                                            <div className="flex items-start justify-between border-b border-gray-200 pb-2 mb-2">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{node.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{node.type} | {node.id}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${node.status === 'LOS' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {node.status}
                                                </span>
                                            </div>

                                            {/* Detail Teknis Tooltip Berdasarkan Tipe */}
                                            {node.type === 'customer' && (
                                                <div className="text-xs text-gray-600 space-y-1.5 mb-3 bg-gray-50 p-2 rounded border border-gray-100">
                                                    <p className="flex justify-between"><span>Paket:</span> <span className="font-bold">{node.package}</span></p>
                                                    <p className="flex justify-between"><span>Kontak:</span> <span className="font-mono">{node.phone}</span></p>
                                                    <p className="flex justify-between text-blue-700">
                                                        <span>Optical Rx:</span> 
                                                        <span className={`font-bold ${node.status === 'LOS' ? 'text-red-600' : ''}`}>{node.rxPower}</span>
                                                    </p>
                                                </div>
                                            )}

                                            {node.type === 'odp' && (
                                                <div className="text-xs text-gray-600 space-y-1 mb-3">
                                                    <p className="flex items-center"><Activity className="w-3 h-3 mr-1 text-gray-400"/> Penggunaan Port: <span className="font-bold text-blue-600 ml-auto">{node.portUsage}</span></p>
                                                </div>
                                            )}
                                            
                                            {/* TOMBOL MANAJEMEN DI POPUP */}
                                            {(user?.role === 'pemilik' || user?.role === 'admin') && (
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                    <button onClick={() => startEdit(node)} className="flex items-center justify-center py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 transition">
                                                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(node.id)} className="flex items-center justify-center py-1.5 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100 transition">
                                                        <Trash2 className="w-3 h-3 mr-1" /> Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>

                                {/* Merender Kabel (Polyline) dengan Pewarnaan Dinamis */}
                                {node.parent && (() => {
                                    const parentNode = nodes.find(n => n.id === node.parent);
                                    if (parentNode) {
                                        return <Polyline 
                                            positions={[[node.lat, node.lng], [parentNode.lat, parentNode.lng]]} 
                                            color={getCableColor(node.type, node.status)} 
                                            weight={node.type === 'customer' ? 2 : 4} 
                                            dashArray={node.type === 'customer' ? "5, 5" : "0"} 
                                            className={getCableClass(node.status)}
                                        />
                                    }
                                })()}
                            </div>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default MapNetwork;