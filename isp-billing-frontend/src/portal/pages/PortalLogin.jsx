import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import portalApi from '../portalApi';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function PortalLogin() {
  const [loadingType, setLoadingType] = useState(null);
  const [error, setError]           = useState('');
  const navigate                    = useNavigate();
  const { login }                   = useCustomerAuth();

  const handleDemo = async (type) => {
    setLoadingType(type);
    setError('');

    try {
      const res = await portalApi.post('/auth/demo', { type });
      if (res.data.success) {
        login(res.data.token, res.data.customer);
        navigate('/portal/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal masuk ke mode demo.';
      setError(msg);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="portal-auth-page">
      <div className="portal-auth-card">
        {/* Logo / Branding */}
        <div className="portal-auth-logo">
          <div className="portal-auth-logo-icon">🌐</div>
          <h1 className="portal-auth-brand">NetBilling</h1>
          <p className="portal-auth-brand-sub">Demo Portal Pelanggan</p>
        </div>

        <h2 className="portal-auth-title">Pilih Skenario Demo</h2>
        <p className="portal-auth-subtitle">
          Klik salah satu tombol di bawah untuk melihat tampilan dashboard pelanggan dalam berbagai kondisi.
        </p>

        {error && (
          <div className="portal-alert portal-alert-error">
            ⚠️ {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={() => handleDemo('lunas')}
            className={`portal-btn !bg-green-600 hover:!bg-green-700 !text-white portal-btn-full flex justify-center items-center gap-2 ${loadingType === 'lunas' ? 'loading' : ''}`}
            disabled={loadingType !== null}
          >
            {loadingType === 'lunas' ? 'Memuat...' : '✅ Skenario: Lunas (Aktif)'}
          </button>

          <button
            onClick={() => handleDemo('menunggak')}
            className={`portal-btn !bg-yellow-500 hover:!bg-yellow-600 !text-white portal-btn-full flex justify-center items-center gap-2 ${loadingType === 'menunggak' ? 'loading' : ''}`}
            disabled={loadingType !== null}
          >
            {loadingType === 'menunggak' ? 'Memuat...' : '⚠️ Skenario: Menunggak (Telat)'}
          </button>

          <button
            onClick={() => handleDemo('terisolir')}
            className={`portal-btn !bg-red-600 hover:!bg-red-700 !text-white portal-btn-full flex justify-center items-center gap-2 ${loadingType === 'terisolir' ? 'loading' : ''}`}
            disabled={loadingType !== null}
          >
            {loadingType === 'terisolir' ? 'Memuat...' : '🚫 Skenario: Terisolir'}
          </button>
        </div>

        <div className="portal-auth-footer mt-10">
          <p>Demo ini hanya menampilkan data simulasi (mock) dari ISP.</p>
        </div>
      </div>
    </div>
  );
}
