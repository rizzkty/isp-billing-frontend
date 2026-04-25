import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import alat memori kita
import { ChevronDown } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('admin'); // Pilihan role default
  
  const { login } = useAuth(); // Ambil fungsi login
  const navigate = useNavigate(); // Alat untuk pindah halaman

  const handleLogin = (e) => {
    e.preventDefault();
    if (username !== '') {
        login(username, role); // Simpan ke memori
        navigate('/dashboard'); // Pindah ke dashboard
    } else {
        alert('Username harus diisi!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
        <h2 className="text-2xl font-bold text-white text-center mb-6">ISP NetBilling</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan username bebas"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1 font-medium">Login Sebagai (Simulasi)</label>
            <div className="relative">
                <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-lg appearance-none outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all font-medium cursor-pointer"
                >
                    <option value="pemilik">Pemilik (Super Admin)</option>
                    <option value="admin">Admin</option>
                    <option value="teknisi">Teknisi</option>
                </select>
                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
            Masuk Sistem
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;