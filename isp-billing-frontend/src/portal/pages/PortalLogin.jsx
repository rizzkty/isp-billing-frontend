/**
 * PortalLogin — Halaman ini tidak lagi digunakan sebagai form login.
 * Akses portal customer hanya melalui magic link yang dikirim admin dari dashboard.
 */
export default function PortalLogin() {
  return (
    <div className="portal-auth-page">
      <div className="portal-auth-card" style={{ textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 32,
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
        }}>
          🔐
        </div>

        <h1 className="portal-auth-brand" style={{ marginBottom: 8 }}>NetBilling</h1>
        <p className="portal-auth-brand-sub" style={{ marginBottom: 28 }}>Portal Pelanggan</p>

        <h2 className="portal-auth-title" style={{ marginBottom: 12 }}>Akses Khusus</h2>
        <p className="portal-auth-subtitle" style={{ marginBottom: 32 }}>
          Portal pelanggan hanya dapat diakses melalui <strong>link khusus</strong> yang dikirimkan oleh admin ISP Anda.
        </p>

        {/* Info box */}
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 28,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 700, marginBottom: 8 }}>
            Cara mendapatkan akses:
          </p>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
            <li>Hubungi admin ISP Anda</li>
            <li>Admin akan membukakan portal langsung dari dashboard</li>
            <li>Link akan terbuka otomatis di browser Anda</li>
          </ul>
        </div>

        <div className="portal-auth-footer">
          <p>Butuh bantuan? Hubungi admin ISP Anda.</p>
          <p className="portal-auth-help">
            <a href="tel:+628123456789">📞 Hubungi Kami</a>
          </p>
        </div>
      </div>
    </div>
  );
}
