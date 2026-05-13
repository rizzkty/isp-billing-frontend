import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import portalApi from '../portalApi';

const STATUS_MAP = {
  paid:      { label: 'LUNAS',       color: '#10b981', icon: '✅' },
  unpaid:    { label: 'BELUM BAYAR', color: '#ef4444', icon: '🔴' },
  cancelled: { label: 'DIBATALKAN',  color: '#6b7280', icon: '⭕' },
};

const PAYMENT_METHOD_MAP = {
  BCA: 'BCA Virtual Account', BNI: 'BNI Virtual Account',
  BRI: 'BRI Virtual Account', MANDIRI: 'Mandiri Virtual Account',
  QRIS: 'QRIS', OVO: 'OVO', DANA: 'DANA', GOPAY: 'GoPay',
  SHOPEEPAY: 'ShopeePay', ALFAMART: 'Alfamart', INDOMARET: 'Indomaret',
};

export default function PortalInvoiceDetail() {
  const { id }                        = useParams();
  const navigate                      = useNavigate();
  const [invoice, setInvoice]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [paying, setPaying]           = useState(false);
  const [payError, setPayError]       = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await portalApi.get(`/invoices/${id}`);
      setInvoice(res.data.invoice);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setPayError('');
    try {
      const res = await portalApi.get(`/invoices/${id}/pay`);
      if (res.data?.payment_url) {
        // Redirect ke Xendit hosted payment page
        window.location.href = res.data.payment_url;
      }
    } catch (err) {
      setPayError(err.response?.data?.message || 'Gagal membuat link pembayaran. Coba lagi.');
    } finally {
      setPaying(false);
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-skeleton-card">
          <div className="portal-skeleton-line portal-skeleton-lg" />
          <div className="portal-skeleton-line" />
          <div className="portal-skeleton-line portal-skeleton-sm" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          <span>❌</span>
          <p>Invoice tidak ditemukan.</p>
          <button className="portal-btn portal-btn-ghost" onClick={() => navigate('/portal/invoices')}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const sc = STATUS_MAP[invoice.status] || STATUS_MAP.cancelled;
  const payMethod = PAYMENT_METHOD_MAP[invoice.payment_method?.toUpperCase()] || invoice.payment_method;

  return (
    <div className="portal-page">
      <button className="portal-back-btn" onClick={() => navigate('/portal/invoices')}>
        ← Semua Tagihan
      </button>

      {/* Invoice Header */}
      <div className="portal-invoice-detail-card">
        <div className="portal-invoice-detail-header">
          <div>
            <h1 className="portal-invoice-detail-title">Tagihan #{invoice.id}</h1>
            <p className="portal-invoice-detail-period">{invoice.period}</p>
          </div>
          <div
            className="portal-invoice-detail-status"
            style={{ color: sc.color }}
          >
            <span className="portal-invoice-detail-status-icon">{sc.icon}</span>
            <span>{sc.label}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="portal-invoice-detail-amount">
          <span className="portal-invoice-detail-label">Jumlah Tagihan</span>
          <span className="portal-invoice-detail-value">{formatRupiah(invoice.amount)}</span>
        </div>

        {/* Detail rows */}
        <div className="portal-invoice-detail-rows">
          <div className="portal-detail-row">
            <span>Paket</span>
            <span>{invoice.package?.name || '—'}</span>
          </div>
          <div className="portal-detail-row">
            <span>Jatuh Tempo</span>
            <span>{invoice.due_date || '—'}</span>
          </div>
          {invoice.status === 'paid' && (
            <>
              <div className="portal-detail-row">
                <span>Dibayar Pada</span>
                <span>{invoice.paid_at || '—'}</span>
              </div>
              <div className="portal-detail-row">
                <span>Metode Bayar</span>
                <span>{payMethod || '—'}</span>
              </div>
            </>
          )}
          {invoice.notes && (
            <div className="portal-detail-row">
              <span>Catatan</span>
              <span className="portal-detail-notes">{invoice.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA: Bayar sekarang */}
      {invoice.status === 'unpaid' && (
        <div className="portal-pay-section">
          {payError && (
            <div className="portal-alert portal-alert-error">{payError}</div>
          )}

          {invoice.has_payment_link && (
            <div className="portal-alert portal-alert-info">
              💡 Link pembayaran aktif tersedia. Klik tombol di bawah untuk melanjutkan.
            </div>
          )}

          <button
            className={`portal-btn portal-btn-pay ${paying ? 'loading' : ''}`}
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? (
              <><span className="portal-spinner-sm" /> Memproses...</>
            ) : (
              <>
                💳 Bayar Sekarang — {formatRupiah(invoice.amount)}
              </>
            )}
          </button>

          <p className="portal-pay-methods">
            Tersedia: Transfer Bank, QRIS, OVO, GoPay, Dana, ShopeePay, Alfamart, Indomaret
          </p>
        </div>
      )}

      {/* Sudah bayar */}
      {invoice.status === 'paid' && (
        <div className="portal-paid-badge">
          <div className="portal-paid-icon">✅</div>
          <h3>Pembayaran Diterima</h3>
          <p>Terima kasih! Tagihan ini sudah lunas pada {invoice.paid_at}.</p>
        </div>
      )}
    </div>
  );
}
