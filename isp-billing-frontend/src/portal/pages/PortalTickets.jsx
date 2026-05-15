import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import portalApi from '../portalApi';

export default function PortalTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'Network' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await portalApi.get('/tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await portalApi.post('/tickets', newTicket);
      setShowModal(false);
      setNewTicket({ title: '', description: '', category: 'Network' });
      fetchTickets();
    } catch (err) {
      alert('Gagal membuat tiket. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <h1 className="portal-page-title">Bantuan & Tiket</h1>
        <p className="portal-greeting-sub">Laporkan kendala teknis atau pertanyaan billing</p>
      </div>

      <div className="portal-section">
        <button className="portal-btn portal-btn-primary" onClick={() => setShowModal(true)}>
          + Buat Tiket Baru
        </button>
      </div>

      <section className="portal-section">
        <h2 className="portal-section-title">Riwayat Tiket</h2>
        
        {loading ? (
          <div className="portal-skeleton-list">
            {[1,2].map(i => <div key={i} className="portal-skeleton-item" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="portal-empty">
            <span>🎫</span>
            <p>Belum ada tiket bantuan</p>
          </div>
        ) : (
          <div className="portal-invoice-list">
            {tickets.map(ticket => (
              <div key={ticket.id} className="portal-invoice-item">
                <div className="portal-invoice-left">
                  <div className="portal-invoice-icon">🎫</div>
                  <div>
                    <span className="portal-invoice-month">{ticket.title}</span>
                    <span className="portal-invoice-pkg">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="portal-invoice-right">
                  <span className={`portal-invoice-status portal-status-${ticket.status}`}>
                    {(ticket.status || 'UNKNOWN').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Buat Tiket */}
      {showModal && (
        <div className="portal-modal-overlay">
          <div className="portal-auth-card" style={{ maxWidth: '500px' }}>
            <h2 className="portal-auth-title">Buat Tiket Baru</h2>
            <form className="portal-auth-form" onSubmit={handleCreateTicket}>
              <div className="portal-form-group">
                <label className="portal-form-label">Kategori</label>
                <select 
                  className="portal-form-input"
                  value={newTicket.category}
                  onChange={e => setNewTicket({...newTicket, category: e.target.value})}
                >
                  <option value="Network">Gangguan Internet</option>
                  <option value="Billing">Pertanyaan Tagihan</option>
                  <option value="Hardware">Masalah Perangkat</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Judul Kendala</label>
                <input 
                  type="text" 
                  className="portal-form-input" 
                  placeholder="Contoh: Internet Sering Putus"
                  required
                  value={newTicket.title}
                  onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Deskripsi Lengkap</label>
                <textarea 
                  className="portal-form-input" 
                  rows="4" 
                  placeholder="Jelaskan detail kendala Anda..."
                  required
                  value={newTicket.description}
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                />
              </div>
              <div className="portal-auth-actions">
                <button type="submit" className="portal-btn portal-btn-primary" disabled={submitting}>
                  {submitting ? 'Mengirim...' : 'Kirim Tiket'}
                </button>
                <button type="button" className="portal-btn portal-btn-ghost" onClick={() => setShowModal(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
