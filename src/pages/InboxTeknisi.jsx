import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertTriangle, ChevronDown } from 'lucide-react';

const InboxTeknisi = () => {
    const { user } = useAuth();
    
    // Dummy Data Tickets - Spesifik untuk Teknisi ini
    const [tickets, setTickets] = useState([
        { id: 1, title: 'Internet Mati', customer: 'Bapak Budi', description: 'LOS merah di modem. Segera dicek ke lokasi.', status: 'Open', source: 'Manual Admin' },
        { id: 2, title: 'Ping Tinggi - Server Game', customer: 'Ibu Ani', description: 'Otomatis terdeteksi latency tinggi pada perangkat ONT pelanggan.', status: 'In Progress', source: 'NOC Otomatis' },
    ]);

    const updateStatus = (id, newStatus) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Open': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'In Progress': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'Resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
            default: return null;
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Inbox Tugas Teknisi</h1>
                <p className="text-gray-500 mt-1">Halo {user?.username || 'Teknisi'}, berikut adalah daftar tugas dan keluhan pelanggan yang ditugaskan kepada Anda.</p>
            </div>

            <div className="space-y-4">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-gray-900">{ticket.title}</h3>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-bold border border-gray-200">
                                    {ticket.source}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-3">{ticket.description}</p>
                            <div className="text-sm text-gray-500">
                                <span className="font-bold text-gray-700">Pelanggan:</span> {ticket.customer}
                            </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px] border-t md:border-t-0 pt-4 md:pt-0 md:pl-6 md:border-l border-gray-100">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(ticket.status)}
                                <span className={`font-bold ${ticket.status === 'Open' ? 'text-red-600' : ticket.status === 'In Progress' ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            
                            <div className="w-full">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Ubah Status Tugas:</label>
                                <div className="relative">
                                    <select 
                                        value={ticket.status} 
                                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 cursor-pointer transition-all"
                                    >
                                        <option value="Open">Open (Belum Dikerjakan)</option>
                                        <option value="In Progress">In Progress (Sedang Dikerjakan)</option>
                                        <option value="Resolved">Resolved (Selesai)</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InboxTeknisi;
