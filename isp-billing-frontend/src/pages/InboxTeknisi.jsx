import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertTriangle, ChevronDown, Loader2 } from 'lucide-react';

const InboxTeknisi = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tickets');
            // Hanya tampilkan tiket yang di-assign ke teknisi ini (atau semua jika demo)
            // Dalam demo, ID Demo Teknisi adalah 3.
            const myTickets = res.data.filter(t => t.assigned_to?.id === user?.id || !t.assigned_to);
            setTickets(myTickets);
        } catch (err) {
            console.error('Gagal mengambil tiket', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [user]);

    const updateStatus = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            await api.put(`/tickets/${id}`, { status: newStatus });
            setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch (err) {
            alert('Gagal mengupdate status tiket');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'open': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'in_progress': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'closed': return <CheckCircle className="w-5 h-5 text-gray-500" />;
            default: return null;
        }
    };

    const formatStatusLabel = (status) => {
        const labels = {
            open: 'Open',
            in_progress: 'In Progress',
            resolved: 'Resolved',
            closed: 'Closed'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        if (status === 'open') return 'text-red-600';
        if (status === 'in_progress') return 'text-yellow-600';
        if (status === 'resolved') return 'text-green-600';
        return 'text-gray-600';
    };

    return (
        <div className="p-8">
            <div className="mb-6 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Inbox Tugas Teknisi</h1>
                <p className="text-gray-500 mt-1">Halo {user?.name || user?.username || 'Teknisi'}, berikut adalah daftar tugas dan keluhan pelanggan yang ditugaskan kepada Anda.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-500 italic">
                    Belum ada tugas tiket yang ditugaskan kepada Anda saat ini.
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-xl text-gray-900">{ticket.title}</h3>
                                    <span className={`text-xs px-2 py-1 rounded font-bold border ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        PRIORITAS: {(ticket.priority || 'medium').toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-3">{ticket.description}</p>
                                <div className="text-sm text-gray-500">
                                    <span className="font-bold text-gray-700">Pelanggan:</span> {ticket.customer?.name || 'Umum'}
                                </div>
                                {ticket.resolution && (
                                    <div className="mt-3 text-sm bg-green-50 text-green-800 p-3 rounded-lg border border-green-100">
                                        <span className="font-bold">Penyelesaian:</span> {ticket.resolution}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px] border-t md:border-t-0 pt-4 md:pt-0 md:pl-6 md:border-l border-gray-100 relative">
                                {updatingId === ticket.id && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(ticket.status)}
                                    <span className={`font-bold ${getStatusColor(ticket.status)}`}>
                                        {formatStatusLabel(ticket.status)}
                                    </span>
                                </div>
                                
                                <div className="w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ubah Status Tugas:</label>
                                    <div className="relative">
                                        <select 
                                            value={ticket.status} 
                                            onChange={(e) => updateStatus(ticket.id, e.target.value)}
                                            disabled={updatingId === ticket.id}
                                            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 appearance-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 cursor-pointer transition-all disabled:opacity-50"
                                        >
                                            <option value="open">Open (Belum Dikerjakan)</option>
                                            <option value="in_progress">In Progress (Sedang Dikerjakan)</option>
                                            <option value="resolved">Resolved (Selesai)</option>
                                        </select>
                                        <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InboxTeknisi;
