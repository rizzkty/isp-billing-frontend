import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

/**
 * PortalLayout — Wrapper untuk semua halaman portal customer.
 * Menampilkan header minimalis khusus customer (berbeda dari sidebar admin).
 * Jika belum login → redirect ke /portal/login.
 */
export default function PortalLayout({ children, requireAuth = true }) {
  const { isLoggedIn, loading, customer, logout } = useCustomerAuth();

  if (loading) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-spinner" />
        <p>Memuat...</p>
      </div>
    );
  }

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/portal/login" replace />;
  }

  // Jika sudah login tapi di halaman public (misal: login), redirect ke dashboard
  if (!requireAuth && isLoggedIn) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return (
    <div className="portal-wrapper">
      <div className="portal-bg-blob portal-bg-blob-1" />
      <div className="portal-bg-blob portal-bg-blob-2" />
      {/* ===== HEADER (hanya di halaman yang butuh auth) ===== */}
      {requireAuth && (
        <header className="portal-header">
          <div className="portal-header-inner">
            <div className="portal-brand">
              <div className="portal-brand-icon">🌐</div>
              <div>
                <span className="portal-brand-name">NetBilling</span>
                <span className="portal-brand-sub">Portal Pelanggan</span>
              </div>
            </div>

            {isLoggedIn && customer && (
              <div className="portal-user-menu">
                <div className="portal-user-info">
                  <div className="portal-avatar">{customer.name?.[0]?.toUpperCase() || 'C'}</div>
                  <div className="portal-user-detail">
                    <span className="portal-user-name">{customer.name}</span>
                    <span className="portal-user-id">ID: {customer.customer_id}</span>
                  </div>
                </div>
                <button className="portal-logout-btn" onClick={logout} title="Logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* ===== NAV (hanya saat logged in & halaman butuh auth) ===== */}
      {requireAuth && isLoggedIn && (
        <nav className="portal-nav">
          <a href="/portal/dashboard" className="portal-nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </a>
          <a href="/portal/invoices" className="portal-nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Tagihan
          </a>
          <a href="/portal/tickets" className="portal-nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Tiket
          </a>
        </nav>
      )}

      {/* ===== CONTENT ===== */}
      <main className="portal-content">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="portal-footer">
        <p>© {new Date().getFullYear()} NetBilling ISP · Layanan Pelanggan 24/7</p>
      </footer>
    </div>
  );
}
