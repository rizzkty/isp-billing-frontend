import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const response = await api.post('/login', {
            username,
            password
        }, {
            timeout: 30000 // 30 seconds timeout (Docker dapat lebih lambat)
        });

        const { user, access_token } = response.data;
        
        // Simpan ke context & localStorage
        login(user, access_token);
        
        // Pindah ke dashboard
        navigate('/dashboard');
    } catch (err) {
        console.error('Login Error:', err);
        setError(err.response?.data?.message || 'Gagal terhubung ke server. Pastikan Backend aktif.');
    } finally {
        setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/demo-login', { role });
      const { user, access_token } = response.data;
      login(user, access_token);
      navigate('/dashboard');
    } catch (err) {
      setError('Gagal masuk demo. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
        <h2 className="text-2xl font-bold text-white text-center mb-2">ISP NetBilling</h2>
        <p className="text-gray-400 text-center text-sm mb-6">Silakan masuk ke akun Anda</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin / teknisi01"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full ${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded mt-4 transition-colors`}
          >
            {loading ? 'Sedang Masuk...' : 'Masuk Sistem'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider font-bold">Akses Demo</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mt-2">
            <button 
              onClick={() => handleDemoLogin('pemilik')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 hover:bg-indigo-600/20 rounded-lg text-sm font-medium transition-all"
            >
              <div className="flex items-center">
                <span className="mr-2 text-base">👑</span>
                <span>Login Pemilik</span>
              </div>
              <span className="text-[10px] bg-indigo-600/20 px-1.5 py-0.5 rounded uppercase font-bold text-indigo-300">Super Admin</span>
            </button>

            <button 
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/20 rounded-lg text-sm font-medium transition-all"
            >
              <div className="flex items-center">
                <span className="mr-2 text-base">🛡️</span>
                <span>Login Admin</span>
              </div>
              <span className="text-[10px] bg-emerald-600/20 px-1.5 py-0.5 rounded uppercase font-bold text-emerald-300">Operational</span>
            </button>

            <button 
              onClick={() => handleDemoLogin('teknisi')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-600/10 border border-orange-600/30 text-orange-400 hover:bg-orange-600/20 rounded-lg text-sm font-medium transition-all"
            >
              <div className="flex items-center">
                <span className="mr-2 text-base">🔧</span>
                <span>Login Teknisi</span>
              </div>
              <span className="text-[10px] bg-orange-600/20 px-1.5 py-0.5 rounded uppercase font-bold text-orange-300">Technical</span>
            </button>

            <a 
              href="/portal/login" 
              className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-600/10 border border-blue-600/30 text-blue-400 hover:bg-blue-600/20 rounded-lg text-sm font-medium transition-all text-center"
            >
              <div className="flex items-center">
                <span className="mr-2 text-base">👤</span>
                <span>Portal Pelanggan</span>
              </div>
              <span className="text-[10px] bg-blue-600/20 px-1.5 py-0.5 rounded uppercase font-bold text-blue-300">Customer</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;