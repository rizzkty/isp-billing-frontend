import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import portalApi from '../portalApi';

const STATUS_CONFIG = {
  aktif:     { label: 'Aktif',     color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: '✅' },
  suspended: { label: 'Suspended', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠️' },
  terisolir: { label: 'Diisolir',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '🚫' },
  inactive:  { label: 'Nonaktif',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '⭕' },
};

export default function PortalDashboard() {
  const { customer, refreshCustomer } = useCustomerAuth();
  const [invoices, setInvoices]       = useState([]);
  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const navigate                      = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  // Show popup on entry for warning/isolated states
  useEffect(() => {
    if (!loading && customer && summary) {
      if (customer.status === 'terisolir' || summary.unpaid_count > 0) {
        setShowModal(true);
      }
    }
  }, [loading, customer, summary]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // refreshCustomer will fetch updated profile including connection stats
      await refreshCustomer();
      const res = await portalApi.get('/invoices');
      setInvoices(res.data.invoices?.slice(0, 3) || []); // 3 latest
      setSummary(res.data.summary || null);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const statusCfg = STATUS_CONFIG[customer?.status] || STATUS_CONFIG.inactive;

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const getStatusBadgeStyle = (status) => {
    const cfg = { paid: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Lunas' },
                  unpaid: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Belum Bayar' },
                  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: 'Dibatalkan' } };
    return cfg[status] || cfg.cancelled;
  };

  return (
    <div className="portal-page">
      {/* ===== GREETING ===== */}
      <div className="portal-greeting">
        <div>
          <h1 className="portal-greeting-title">
            Halo, {customer?.name?.split(' ')[0] || 'Pelanggan'}! 👋
          </h1>
          <p className="portal-greeting-sub">ID Pelanggan: <strong>{customer?.customer_id}</strong></p>
        </div>
        <div className="portal-greeting-badges">
          {customer?.customer_id === 'CUST-DEMO-02' && (
            <div className="portal-badge portal-badge-warning">
               Tagihan akan jatuh tempo
            </div>
          )}
          <div className={`portal-status-badge portal-status-${customer?.status === 'aktif' ? 'aktif' : 'isolir'}`}>
            {statusCfg.icon} {statusCfg.label}
          </div>
        </div>
      </div>

      {/* ===== LIVE MONITORING (Reference Inspired) ===== */}
      <div className="portal-monitor-card">
        <div className="portal-monitor-header">
          <div className={`portal-pulse ${customer?.connection?.is_connected ? '' : 'offline'}`} />
          <span className="portal-monitor-title">Live Connection Status</span>
          <div className={`portal-monitor-status ${customer?.connection?.is_connected ? 'connected' : 'offline'}`}>
            {(customer?.connection?.is_connected) ? 'Connected' : 'Offline'}
          </div>
        </div>
        
        <div className="portal-monitor-grid">
          <div className="portal-monitor-item">
            <span className="portal-monitor-label">IP Address</span>
            <span className="portal-monitor-value">{customer?.connection?.ip_address || '-'}</span>
          </div>
          <div className="portal-monitor-item">
            <span className="portal-monitor-label">Bytes up / down</span>
            <span className="portal-monitor-value">
              {customer?.connection?.upload || '0 MiB'} / {customer?.connection?.download || '0 MiB'}
            </span>
          </div>
          <div className="portal-monitor-item">
            <span className="portal-monitor-label">Connected</span>
            <span className="portal-monitor-value">{customer?.connection?.uptime || '-'}</span>
          </div>
          <div className="portal-monitor-item">
            <span className="portal-monitor-label">MAC Address</span>
            <span className="portal-monitor-value">{customer?.connection?.mac_address || '-'}</span>
          </div>
        </div>
      </div>

      {/* ===== CARDS SUMMARY ===== */}
      <div className="portal-cards-grid">
        <div className="portal-card portal-card-primary">
          <div className="portal-card-icon">📦</div>
          <div className="portal-card-content">
            <span className="portal-card-label">Paket Anda</span>
            <span className="portal-card-value">{customer?.package?.name || '—'}</span>
            <span className="portal-card-sub">{customer?.package?.speed || '—'}</span>
          </div>
        </div>

        <div className="portal-card portal-card-danger">
          <div className="portal-card-icon">💰</div>
          <div className="portal-card-content">
            <span className="portal-card-label">Belum Bayar</span>
            <span className="portal-card-value">{formatRupiah(summary?.total_unpaid)}</span>
            <span className="portal-card-sub">{summary?.unpaid_count || 0} tagihan</span>
          </div>
        </div>

        <div className="portal-card portal-card-success">
          <div className="portal-card-icon">✅</div>
          <div className="portal-card-content">
            <span className="portal-card-label">Total Dibayar</span>
            <span className="portal-card-value">{formatRupiah(summary?.total_paid)}</span>
            <span className="portal-card-sub">Historis</span>
          </div>
        </div>
      </div>

      {/* ===== BANNER MENUNGGAK ===== */}
      {customer?.status === 'aktif' && (summary?.unpaid_count > 0) && (
        <div className="portal-alert portal-alert-warning portal-alert-big">
          <div>
            <strong>⚠️ Anda memiliki tagihan yang belum dibayar</strong>
            <p>Segera lakukan pembayaran sebesar <strong>{formatRupiah(summary?.total_unpaid)}</strong> agar layanan tetap aktif.</p>
          </div>
        </div>
      )}

      {/* ===== BANNER ISOLIR ===== */}
      {customer?.status === 'terisolir' && (
        <div className="portal-alert portal-alert-danger portal-alert-big">
          <div>
            <strong>🚫 Layanan Anda sedang diisolir</strong>
            <p>Selesaikan pembayaran tagihan di bawah untuk mengaktifkan kembali koneksi Anda.</p>
          </div>
        </div>
      )}

      {/* ===== TAGIHAN TERBARU ===== */}
      <section className="portal-section">
        <div className="portal-section-header">
          <h2 className="portal-section-title">Tagihan Terbaru</h2>
          <button className="portal-link-btn" onClick={() => navigate('/portal/invoices')}>
            Lihat semua →
          </button>
        </div>

        {loading ? (
          <div className="portal-skeleton-list">
            {[1,2,3].map(i => <div key={i} className="portal-skeleton-item" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="portal-empty">
            <span>📋</span>
            <p>Belum ada tagihan</p>
          </div>
        ) : (
          <div className="portal-invoice-list">
            {invoices.map((inv) => {
              const sc = getStatusBadgeStyle(inv.status);
              return (
                <div
                  key={inv.id}
                  className="portal-invoice-item"
                  onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                >
                  <div className="portal-invoice-left">
                    <div className="portal-invoice-icon">📄</div>
                    <div className="portal-invoice-period">
                      <span className="portal-invoice-month">{inv.period}</span>
                      <span className="portal-invoice-pkg">{inv.package}</span>
                    </div>
                  </div>
                  <div className="portal-invoice-right">
                    <span className="portal-invoice-amount">{formatRupiah(inv.amount)}</span>
                    <span
                      className="portal-invoice-status"
                      style={{ color: sc.color, background: sc.bg }}
                    >
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="portal-section">
        <h2 className="portal-section-title">Aksi Cepat</h2>
        <div className="portal-quick-actions">
          <button className="portal-quick-btn" onClick={() => navigate('/portal/invoices')}>
            <span>🧾</span>
            <span>Tagihan</span>
          </button>
          <button className="portal-quick-btn" onClick={() => navigate('/portal/tickets')}>
            <span>🎫</span>
            <span>Bantuan</span>
          </button>
          <button className="portal-quick-btn" onClick={() => navigate('/portal/invoices')}>
            <span>💳</span>
            <span>Bayar</span>
          </button>
        </div>
      </section>

      {/* ===== NOTIFICATION MODAL ===== */}
      {showModal && (
        <div className="portal-modal-overlay">
          <div className="portal-modal-content">
            <div className="portal-modal-header">
              <h3>Notifikasi Penting</h3>
              <button className="portal-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="portal-modal-body">
              <div className={`portal-modal-alert ${customer?.status === 'terisolir' ? 'danger' : 'warning'}`}>
                {customer?.status === 'terisolir' ? (
                  <>
                    <span className="portal-modal-icon">🚫</span>
                    <div>
                      <p><strong>Layanan Anda Telah Diisolir</strong></p>
                      <p>Mohon segera lakukan pembayaran sebesar <strong>{formatRupiah(summary?.total_unpaid)}</strong> untuk mengaktifkan kembali layanan internet Anda.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="portal-modal-icon">⚠️</span>
                    <div>
                      <p><strong>Peringatan Pembayaran</strong></p>
                      <p>Anda memiliki tagihan yang akan segera jatuh tempo sebesar <strong>{formatRupiah(summary?.total_unpaid)}</strong>. Bayar sekarang untuk menghindari isolir.</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="portal-modal-actions">
                <button className="portal-btn-secondary" onClick={() => setShowModal(false)}>Nanti Saja</button>
                <button className="portal-btn-primary" onClick={() => {
                  setShowModal(false);
                  navigate('/portal/invoices');
                }}>Bayar Sekarang</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
