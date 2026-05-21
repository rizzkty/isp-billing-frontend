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
            timeout: 30000 // 30 seconds timeout
        });

        const { user, access_token } = response.data;
        
        login(user, access_token);
        navigate('/dashboard');
    } catch (err) {
        console.error('Login Error:', err);
        setError(err.response?.data?.message || 'Gagal terhubung ke server. Pastikan Backend aktif.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      
      {/* Kotak Form Gelap */}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700">
        
        {/* ================================================== */}
        {/* BAGIAN HEADER: Logo Diperbesar */}
        {/* ================================================== */}
        <div className="flex items-center justify-center gap-4 mb-2">
          {/* Kotak Logo N (Diperbesar ke w-14 h-14) */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            {/* Teks Logo (Diperbesar ke text-4xl) */}
            <span className="text-white font-black text-4xl tracking-tighter">N</span>
          </div>
          {/* Teks Judul (Diperbesar ke text-3xl agar seimbang) */}
          <h2 className="text-3xl font-bold text-white tracking-tight">ISP NetBilling</h2>
        </div>
        
        <p className="text-gray-400 text-center text-sm mb-6 mt-1">Silakan masuk ke akun Anda</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1.5">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 text-white border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
              placeholder="admin / teknisi01"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 text-white border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full ${loading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold py-3 px-4 rounded-lg mt-6 transition-all shadow-lg shadow-blue-600/30`}
          >
            {loading ? 'Sedang Masuk...' : 'Masuk Sistem'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;