import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, ChevronDown } from 'lucide-react';

const Ticketing = () => {
    const { user } = useAuth();
    
    // Dummy Data Tickets
    const [tickets, setTickets] = useState([
        { id: 1, title: 'Internet Mati', customer: 'Bapak Budi', description: 'LOS merah di modem', status: 'Open', assignedTo: 'teknisi', source: 'Manual Admin' },
        { id: 2, title: 'Speed Lambat', customer: 'Ibu Ani', description: 'Ping tinggi ke server game', status: 'In Progress', assignedTo: 'teknisi', source: 'NOC Otomatis' },
    ]);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', customer: '', description: '', status: 'Open', assignedTo: '', source: 'Manual Admin' });

    const handleCreate = (e) => {
        e.preventDefault();
        const newTicket = {
            id: tickets.length + 1,
            ...formData
        };
        setTickets([...tickets, newTicket]);
        setShowForm(false);
        setFormData({ title: '', customer: '', description: '', status: 'Open', assignedTo: '', source: 'Manual Admin' });
    };

    const updateStatus = (id, newStatus) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Ticketing & Penugasan</h1>
                    <p className="text-gray-500 mt-1">Sistem penugasan teknisi untuk keluhan pelanggan</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'pemilik') && (
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition font-bold flex items-center"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Buat Ticket Baru
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                    <h2 className="text-xl font-bold mb-4">Form Tiket Baru</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1">Judul Keluhan</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Nama Pelanggan</label>
                                <input type="text" required value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} className="w-full border rounded p-2" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1">Deskripsi Masalah</label>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded p-2" rows="3"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tugaskan Ke</label>
                                <div className="relative">
                                    <select value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-700 cursor-pointer">
                                        <option value="">Pilih Teknisi...</option>
                                        <option value="teknisi">Teknisi (Sistem)</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 font-bold">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Simpan Ticket</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white rounded-lg shadow p-5 border border-gray-200 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{ticket.title}</h3>
                            <div className="flex gap-2 items-center">
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                                    {ticket.source}
                                </span>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${ticket.status === 'Open' ? 'bg-red-100 text-red-800' : ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {ticket.status}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 flex-1">{ticket.description}</p>
                        <div className="text-sm text-gray-500 space-y-1 mb-4 bg-gray-50 p-2 rounded">
                            <p><strong>Pelanggan:</strong> {ticket.customer}</p>
                            <p><strong>Teknisi:</strong> {ticket.assignedTo || 'Belum ditugaskan'}</p>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-600">Update Status:</label>
                            <div className="relative w-36">
                                <select 
                                    value={ticket.status} 
                                    onChange={(e) => updateStatus(ticket.id, e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 pr-8 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none bg-white cursor-pointer transition-all"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Ticketing;
