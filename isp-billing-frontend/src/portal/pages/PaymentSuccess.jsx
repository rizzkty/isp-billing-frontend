import { useNavigate } from 'react-router-dom';

/**
 * PaymentSuccess — Halaman redirect setelah pembayaran Xendit berhasil.
 * Xendit redirect ke: /portal/payment/success
 */
export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="portal-payment-result">
      <div className="portal-payment-result-card portal-payment-result-success">
        <div className="portal-result-icon">🎉</div>
        <h1 className="portal-result-title">Pembayaran Berhasil!</h1>
        <p className="portal-result-subtitle">
          Terima kasih! Pembayaran Anda sedang diproses.
          Anda akan menerima konfirmasi via WhatsApp segera.
        </p>
        <div className="portal-result-info">
          <p>✅ Invoice Anda akan diperbarui otomatis</p>
          <p>📱 Konfirmasi dikirim ke WhatsApp Anda</p>
          <p>🌐 Koneksi internet tetap aktif</p>
        </div>
        <div className="portal-result-actions">
          <button
            className="portal-btn portal-btn-primary"
            onClick={() => navigate('/portal/invoices')}
          >
            Lihat Tagihan
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
