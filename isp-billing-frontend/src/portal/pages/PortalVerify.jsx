import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import portalApi from '../portalApi';

/**
 * PortalVerify — Halaman verifikasi magic link.
 * Bisa menerima token dari: URL param (?token=xxx) ATAU input manual.
 */
export default function PortalVerify() {
  const [token, setToken]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [autoVerifying, setAutoVerifying] = useState(false);

  const { login }       = useCustomerAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  // Jika ada token di URL (?token=xxx), auto-verify
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setAutoVerifying(true);
      verifyToken(urlToken);
    }
  }, []); // eslint-disable-line

  const verifyToken = async (tokenValue) => {
    const t = tokenValue || token;
    if (!t?.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await portalApi.post('/auth/verify-link', { token: t.trim() });

      if (res.data?.success) {
        // Simpan session
        login(res.data.token, res.data.customer);
        // Redirect ke dashboard
        navigate('/portal/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Token tidak valid atau sudah kadaluarsa.';
      setError(msg);
      setAutoVerifying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyToken(token);
  };

  // ===== STATE: Auto-verifying dari URL =====
  if (autoVerifying && loading) {
    return (
      <div className="portal-auth-page">
        <div className="portal-auth-card portal-auth-card-center">
          <div className="portal-verify-spinner">
            <div className="portal-spinner-large" />
          </div>
          <h2 className="portal-auth-title">Memverifikasi link...</h2>
          <p className="portal-auth-subtitle">Mohon tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-auth-page">
      <div className="portal-auth-card">
        <div className="portal-auth-logo">
          <div className="portal-auth-logo-icon">🔐</div>
          <h1 className="portal-auth-brand">Verifikasi Login</h1>
        </div>

        {/* Info: cek WA */}
        {!error && (
          <div className="portal-verify-info">
            <div className="portal-wa-icon">💬</div>
            <p>Link login sudah dikirim ke WhatsApp Anda.</p>
            <p className="portal-auth-note">Klik link di WA, atau masukkan token di bawah:</p>
          </div>
        )}

        {error && (
          <div className="portal-alert portal-alert-error">
            ⚠️ {error}
            <br />
            <small>Minta link baru dari halaman login.</small>
          </div>
        )}

        <form onSubmit={handleSubmit} className="portal-auth-form">
          <div className="portal-form-group">
            <label className="portal-form-label" htmlFor="token">
              Masukkan Token (jika tidak bisa klik link)
            </label>
            <input
              id="token"
              type="text"
              className="portal-form-input portal-token-input"
              placeholder="Token dari pesan WhatsApp..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className={`portal-btn portal-btn-primary portal-btn-full ${loading ? 'loading' : ''}`}
            disabled={loading || !token.trim()}
          >
            {loading ? (
              <><span className="portal-spinner-sm" /> Memverifikasi...</>
            ) : (
              '✅ Verifikasi & Masuk'
            )}
          </button>
        </form>

        <div className="portal-auth-actions">
          <button
            className="portal-btn portal-btn-ghost"
            onClick={() => navigate('/portal/login')}
          >
            ← Minta link baru
          </button>
        </div>
      </div>
    </div>
  );
}
