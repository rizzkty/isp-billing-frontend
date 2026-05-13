import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import portalApi from '../portalApi';

const STATUS_MAP = {
  paid:      { label: 'Lunas',         color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '✅' },
  unpaid:    { label: 'Belum Bayar',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '🔴' },
  cancelled: { label: 'Dibatalkan',    color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '⭕' },
};

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const navigate                = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await portalApi.get('/invoices');
      setInvoices(res.data.invoices || []);
      setSummary(res.data.summary || null);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <button className="portal-back-btn" onClick={() => navigate('/portal/dashboard')}>
          ← Kembali
        </button>
        <h1 className="portal-page-title">🧾 Tagihan Saya</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="portal-invoice-summary">
          <div className="portal-summary-item portal-summary-danger">
            <span className="portal-summary-label">Belum Dibayar</span>
            <span className="portal-summary-value">{formatRupiah(summary.total_unpaid)}</span>
            <span className="portal-summary-count">{summary.unpaid_count} tagihan</span>
          </div>
          <div className="portal-summary-item portal-summary-success">
            <span className="portal-summary-label">Total Dibayar</span>
            <span className="portal-summary-value">{formatRupiah(summary.total_paid)}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="portal-filter-tabs">
        {[
          { key: 'all',       label: 'Semua' },
          { key: 'unpaid',    label: 'Belum Bayar' },
          { key: 'paid',      label: 'Lunas' },
          { key: 'cancelled', label: 'Dibatalkan' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`portal-filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="portal-skeleton-list">
          {[1,2,3,4,5].map(i => <div key={i} className="portal-skeleton-item" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="portal-empty">
          <span>📋</span>
          <p>Tidak ada tagihan {filter !== 'all' ? `dengan status "${STATUS_MAP[filter]?.label}"` : ''}</p>
        </div>
      ) : (
        <div className="portal-invoice-list">
          {filtered.map((inv) => {
            const sc = STATUS_MAP[inv.status] || STATUS_MAP.cancelled;
            return (
              <div
                key={inv.id}
                className="portal-invoice-item portal-invoice-item-clickable"
                onClick={() => navigate(`/portal/invoices/${inv.id}`)}
              >
                <div className="portal-invoice-left">
                  <span className="portal-invoice-icon">{sc.icon}</span>
                  <div>
                    <span className="portal-invoice-month">{inv.period}</span>
                    <span className="portal-invoice-pkg">{inv.package}</span>
                    {inv.due_date && (
                      <span className="portal-invoice-due">
                        Jatuh tempo: {inv.due_date}
                      </span>
                    )}
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
                  {inv.status === 'unpaid' && (
                    <span className="portal-invoice-pay-hint">Klik untuk bayar →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
