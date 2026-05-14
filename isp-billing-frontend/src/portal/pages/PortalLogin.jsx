import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import portalApi from '../portalApi';
import { useCustomerAuth } from '../context/CustomerAuthContext';

/**
 * PortalLogin — Halaman utama portal customer.
 * Customer input nomor HP atau ID Pelanggan → backend kirim magic link via WA.
 */
export default function PortalLogin() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading]       = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState('');
  const navigate                    = useNavigate();
  const { login }                   = useCustomerAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError('');

    try {
      await portalApi.post('/auth/request-link', { identifier: identifier.trim() });
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');

    try {
      const res = await portalApi.post('/auth/demo');
      if (res.data.success) {
        login(res.data.token, res.data.customer);
        navigate('/portal/dashboard');
      }
    } catch (err) {
      setError('Gagal masuk ke mode demo.');
    } finally {
      setDemoLoading(false);
    }
  };

  // ===== STATE: Sudah kirim link =====
  if (sent) {
    return (
      <div className="portal-auth-page">
        <div className="portal-auth-card">
          <div className="portal-auth-success-icon">📱</div>
          <h2 className="portal-auth-title">Cek WhatsApp Anda!</h2>
          <p className="portal-auth-subtitle">
            Jika nomor <strong>{identifier}</strong> terdaftar, link login telah dikirim ke WhatsApp Anda.
          </p>
          <p className="portal-auth-note">⏰ Link berlaku selama <strong>15 menit</strong></p>

          <div className="portal-auth-actions">
            <button
              className="portal-btn portal-btn-primary"
              onClick={() => navigate('/portal/verify')}
            >
              Punya token? Masukkan manual →
            </button>
            <button
              className="portal-btn portal-btn-ghost"
              onClick={() => setSent(false)}
            >
              Kirim ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== STATE: Form input =====
  return (
    <div className="portal-auth-page">
      <div className="portal-auth-card">
        {/* Logo / Branding */}
        <div className="portal-auth-logo">
          <div className="portal-auth-logo-icon">🌐</div>
          <h1 className="portal-auth-brand">NetBilling</h1>
          <p className="portal-auth-brand-sub">Portal Pelanggan</p>
        </div>

        <h2 className="portal-auth-title">Masuk ke Portal</h2>
        <p className="portal-auth-subtitle">
          Masukkan nomor HP atau ID Pelanggan Anda. Kami akan mengirim link login ke WhatsApp.
        </p>

        {error && (
          <div className="portal-alert portal-alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="portal-auth-form">
          <div className="portal-form-group">
            <label className="portal-form-label" htmlFor="identifier">
              Nomor HP atau ID Pelanggan
            </label>
            <input
              id="identifier"
              type="text"
              className="portal-form-input"
              placeholder="cth: 08123456789 atau CUST-001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="tel"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`portal-btn portal-btn-primary portal-btn-full ${loading ? 'loading' : ''}`}
            disabled={loading || !identifier.trim()}
          >
            {loading ? (
              <><span className="portal-spinner-sm" /> Mengirim...</>
            ) : (
              <>📲 Kirim Link Login via WhatsApp</>
            )}
          </button>
        </form>

        <div className="portal-auth-divider">
          <span>ATAU</span>
        </div>

        <button
          onClick={handleDemo}
          className={`portal-btn portal-btn-ghost portal-btn-full ${demoLoading ? 'loading' : ''}`}
          disabled={loading || demoLoading}
        >
          {demoLoading ? 'Menyiapkan...' : '✨ Akses Demo (Tanpa Login)'}
        </button>

        <div className="portal-auth-footer">
          <p>Belum punya akun? Hubungi admin ISP Anda.</p>
          <p className="portal-auth-help">
            Nomor tidak terdaftar? <a href="tel:+628123456789">Hubungi kami</a>
          </p>
        </div>
      </div>
    </div>
  );
}
