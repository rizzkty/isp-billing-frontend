import { useNavigate } from 'react-router-dom';

/**
 * PaymentFailed — Halaman redirect setelah pembayaran Xendit gagal/dibatalkan.
 */
export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="portal-payment-result">
      <div className="portal-payment-result-card portal-payment-result-failed">
        <div className="portal-result-icon">😔</div>
        <h1 className="portal-result-title">Pembayaran Gagal</h1>
        <p className="portal-result-subtitle">
          Pembayaran Anda tidak berhasil diproses atau dibatalkan.
          Tagihan Anda belum berubah — Anda dapat mencoba lagi.
        </p>
        <div className="portal-result-info">
          <p>❌ Tagihan belum terbayar</p>
          <p>🔄 Anda bisa mencoba bayar lagi</p>
          <p>💬 Butuh bantuan? Hubungi admin ISP</p>
        </div>
        <div className="portal-result-actions">
          <button
            className="portal-btn portal-btn-danger"
            onClick={() => navigate('/portal/invoices')}
          >
            Coba Bayar Lagi
          </button>
          <button
            className="portal-btn portal-btn-ghost"
            onClick={() => navigate('/portal/dashboard')}
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
