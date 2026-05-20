import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertTriangle, ChevronDown, Loader2, Camera, PenTool, Upload, X } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const SignaturePad = ({ onChange }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    const startDrawing = (e) => {
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (hasSigned) {
                const dataUrl = canvasRef.current.toDataURL();
                onChange(dataUrl);
            }
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        onChange(null);
    };

    return (
        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500">Tanda Tangan Pelanggan</span>
                <button type="button" onClick={clear} className="text-xs font-bold text-red-500 hover:text-red-700">Bersihkan</button>
            </div>
            <canvas 
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-white rounded-lg border border-gray-200 cursor-crosshair touch-none"
            />
        </div>
    );
};

const InboxTeknisi = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    // Resolve Verification Modal States
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolutionText, setResolutionText] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [signatureImage, setSignatureImage] = useState(null);
    const [resolveLoading, setResolveLoading] = useState(false);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tickets');
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

    const handleStatusChange = (ticket, newStatus) => {
        if (newStatus === 'resolved') {
            setSelectedTicket(ticket);
            setResolutionText('');
            setProofImage(null);
            setSignatureImage(null);
            setShowResolveModal(true);
        } else {
            updateStatus(ticket.id, newStatus);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!resolutionText || resolutionText.trim().length < 10) {
            alert('Deskripsi penyelesaian minimal 10 karakter.');
            return;
        }
        if (!proofImage) {
            alert('Silakan unggah foto bukti penyelesaian.');
            return;
        }
        if (!signatureImage) {
            alert('Silakan minta tanda tangan pelanggan.');
            return;
        }

        try {
            setResolveLoading(true);
            const res = await api.put(`/tickets/${selectedTicket.id}`, {
                status: 'resolved',
                resolution: resolutionText,
                proof_image: proofImage,
                signature_image: signatureImage
            });
            
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { 
                ...t, 
                status: 'resolved', 
                resolution: resolutionText,
                proof_image: res.data.data?.proof_image || proofImage,
                signature_image: signatureImage
            } : t));
            
            setShowResolveModal(false);
            setSelectedTicket(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyelesaikan tiket');
        } finally {
            setResolveLoading(false);
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
                                    <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Detail Verifikasi Penyelesaian</h4>
                                        <p className="text-sm text-gray-700 font-medium"><span className="text-gray-400 font-normal">Penyelesaian: </span>{ticket.resolution}</p>
                                        
                                        <div className="flex gap-4 flex-wrap mt-2">
                                            {ticket.proof_image && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-gray-400">Bukti Foto:</span>
                                                    <a href={ticket.proof_image} target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden rounded-lg border border-gray-200 w-24 h-24 block bg-white">
                                                        <img src={ticket.proof_image} alt="Bukti Foto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">Lihat</div>
                                                    </a>
                                                </div>
                                            )}
                                            {ticket.signature_image && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-gray-400">Tanda Tangan Pelanggan:</span>
                                                    <div className="bg-white border border-gray-200 rounded-lg p-1 w-32 h-24 flex items-center justify-center overflow-hidden">
                                                        <img src={ticket.signature_image} alt="Tanda Tangan" className="max-h-full max-w-full object-contain" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                                            onChange={(e) => handleStatusChange(ticket, e.target.value)}
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

            {/* Resolve Verification Modal */}
            <Modal
                isOpen={showResolveModal}
                onClose={() => {
                    setShowResolveModal(false);
                    setSelectedTicket(null);
                }}
                title="Verifikasi Penyelesaian Gangguan"
                size="md"
                loading={resolveLoading}
                loadingText="Menyimpan Laporan..."
            >
                <form onSubmit={handleResolveSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Deskripsi Penyelesaian <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            placeholder="Jelaskan tindakan perbaikan yang dilakukan (misal: Ganti patch cord fiber optik yang tertekuk, restart ONT, redaman normal -21dBm)..."
                            className="w-full text-sm border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-[10px] text-gray-400 block mt-1">Minimal 10 karakter.</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Unggah Foto Bukti Lapangan <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors text-sm font-bold">
                                <Camera className="w-4 h-4" />
                                {proofImage ? 'Ganti Foto' : 'Ambil/Pilih Foto'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                            {proofImage && (
                                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Foto terpilih
                                </span>
                            )}
                        </div>
                        {proofImage && (
                            <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-gray-200">
                                <img src={proofImage} alt="Preview Bukti" className="h-32 object-cover max-w-full" />
                                <button
                                    type="button"
                                    onClick={() => setProofImage(null)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Tanda Tangan Pelanggan <span className="text-red-500">*</span>
                        </label>
                        <SignaturePad onChange={(signature) => setSignatureImage(signature)} />
                    </div>

                    <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => {
                                setShowResolveModal(false);
                                setSelectedTicket(null);
                            }}
                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                            disabled={resolveLoading}
                        >
                            Simpan & Selesaikan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default InboxTeknisi;
