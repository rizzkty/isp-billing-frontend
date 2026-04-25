import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
        const response = await axios.post('http://localhost:8000/api/login', {
            username,
            password
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
      </div>
    </div>
  );
};

export default Login;