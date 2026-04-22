import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Phone, Info, Settings, Plus, X, MapPin, Share2, Home, Server, ChevronRight, Edit2, Trash2 } from 'lucide-react';

// === KONFIGURASI IKON ===
const getIcon = (type) => {
    let url = 'https://cdn-icons-png.flaticon.com/512/684/684908.png';
    if (type === 'server') url = 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png';
    if (type === 'odc') url = 'https://cdn-icons-png.flaticon.com/512/9431/9431186.png';
    if (type === 'odp') url = 'https://cdn-icons-png.flaticon.com/512/2991/2991231.png';
    if (type === 'customer') url = 'https://cdn-icons-png.flaticon.com/512/619/619153.png';

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
    
    // State Utama Jaringan
    const [nodes, setNodes] = useState([
        { id: 'SVR-01', name: 'NOC Pusat Jember', type: 'server', lat: -8.1724, lng: 113.6995, parent: null },
        { id: 'ODC-01', name: 'ODC Patrang', type: 'odc', lat: -8.1650, lng: 113.7050, parent: 'SVR-01' },
        { id: 'ODP-01', name: 'ODP Mastrip 1', type: 'odp', lat: -8.1685, lng: 113.7025, parent: 'ODC-01' },
        { id: 'CUST-01', name: 'Budi Santoso', type: 'customer', lat: -8.1691, lng: 113.7020, parent: 'ODP-01', package: '20 Mbps', phone: '0812345', status: 'Aktif' },
    ]);

    // State Editor
    const [editMode, setEditMode] = useState(null); // 'server', 'odc', etc
    const [isUpdating, setIsUpdating] = useState(null); // ID node yang sedang diupdate
    const [tempCoords, setTempCoords] = useState(null);
    const [formData, setFormData] = useState({ name: '', parent: '', package: '10 Mbps', phone: '', address: '' });

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
                status: 'Aktif'
            };
            setNodes([...nodes, newNode]);
            alert('Titik baru berhasil ditambahkan!');
        }
        resetForm();
    };

    // Fungsi Hapus
    const handleDelete = (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus titik ini? Garis yang terhubung juga akan hilang.')) {
            setNodes(nodes.filter(n => n.id !== id));
        }
    };

    // Fungsi Masuk Mode Edit
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
                    <h1 className="text-3xl font-bold text-gray-800">NOC Network Manager</h1>
                    <p className="text-gray-500">Ubah, Pindahkan, atau Hapus infrastruktur jaringan</p>
                </div>

                {/* TOOLBAR EDITOR */}
                {(user?.role === 'pemilik' || user?.role === 'admin') && (
                    <div className="flex bg-white p-1 rounded-lg shadow-md border border-gray-200">
                        <button onClick={() => setEditMode('server')} className={`p-2 rounded flex items-center text-xs font-bold ${editMode === 'server' ? 'bg-red-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> Server
                        </button>
                        <button onClick={() => setEditMode('odc')} className={`p-2 rounded flex items-center text-xs font-bold ${editMode === 'odc' ? 'bg-orange-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> ODC
                        </button>
                        <button onClick={() => setEditMode('odp')} className={`p-2 rounded flex items-center text-xs font-bold ${editMode === 'odp' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> ODP
                        </button>
                        <button onClick={() => setEditMode('customer')} className={`p-2 rounded flex items-center text-xs font-bold ${editMode === 'customer' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <Plus className="w-3 h-3 mr-1" /> Rumah
                        </button>
                    </div>
                )}
            </div>

            <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                
                {/* FORM PANEL (Tambah/Edit) */}
                {(tempCoords || isUpdating) && (
                    <div className="absolute top-4 right-4 z-[1000] w-80 bg-white p-5 rounded-lg shadow-2xl border-t-4 border-blue-600 animate-slideIn">
                        <h3 className="font-bold mb-4 uppercase text-xs text-gray-400 flex items-center">
                            {isUpdating ? 'Edit Data' : 'Tambah Baru'} <ChevronRight className="w-3 h-3 mx-1" /> {editMode}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-3">
                            <input type="text" placeholder="Nama Titik..." required className="w-full p-2 text-sm border rounded" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            
                            {editMode === 'customer' && (
                                <select className="w-full p-2 text-sm border rounded" value={formData.package} onChange={(e) => setFormData({...formData, package: e.target.value})}>
                                    <option value="10 Mbps">10 Mbps</option>
                                    <option value="20 Mbps">20 Mbps</option>
                                    <option value="50 Mbps">50 Mbps</option>
                                </select>
                            )}

                            <select className="w-full p-2 text-sm border rounded font-bold" value={formData.parent} onChange={(e) => setFormData({...formData, parent: e.target.value})}>
                                <option value="">Pilih Uplink...</option>
                                {nodes.filter(n => n.id !== isUpdating && (editMode === 'customer' ? n.type === 'odp' : editMode === 'odp' ? n.type === 'odc' : n.type === 'server')).map(n => (
                                    <option key={n.id} value={n.id}>{n.name}</option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button type="button" onClick={resetForm} className="p-2 text-xs font-bold bg-gray-100 rounded">Batal</button>
                                <button type="submit" className="p-2 text-xs font-bold bg-blue-600 text-white rounded">Simpan</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="h-[650px] w-full">
                    <MapContainer center={[-8.1724, 113.6995]} zoom={14} style={{ height: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapClickHandler active={editMode !== null && !isUpdating} onMapClick={setTempCoords} />

                        {nodes.map(node => (
                            <div key={node.id}>
                                <Marker position={[node.lat, node.lng]} icon={getIcon(node.type)}>
                                    <Popup>
                                        <div className="p-1 min-w-[180px]">
                                            <p className="font-bold border-b pb-1 mb-2">{node.name}</p>
                                            <p className="text-[10px] text-gray-400 mb-3 uppercase tracking-widest">{node.type} | {node.id}</p>
                                            
                                            {/* TOMBOL MANAJEMEN DI POPUP */}
                                            {(user?.role === 'pemilik' || user?.role === 'admin') && (
                                                <div className="grid grid-cols-2 gap-2 border-t pt-3">
                                                    <button onClick={() => startEdit(node)} className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded text-xs font-bold">
                                                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(node.id)} className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded text-xs font-bold">
                                                        <Trash2 className="w-3 h-3 mr-1" /> Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>

                                {node.parent && (() => {
                                    const parentNode = nodes.find(n => n.id === node.parent);
                                    if (parentNode) {
                                        return <Polyline positions={[[node.lat, node.lng], [parentNode.lat, parentNode.lng]]} color={node.type === 'customer' ? '#3b82f6' : '#8b5cf6'} weight={node.type === 'customer' ? 2 : 4} dashArray={node.type === 'customer' ? "5, 10" : "0"} opacity={0.6} />
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