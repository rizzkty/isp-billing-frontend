import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
            <h2 className="text-2xl font-bold mb-8 text-blue-400">NetBilling</h2>
            
            {/* --- MENU UTAMA --- */}
            <nav className="flex-1 space-y-2">
                <Link to="/dashboard" className="block p-3 rounded hover:bg-gray-800 transition">Dashboard</Link>
                <Link to="/customers" className="block p-3 rounded hover:bg-gray-800 transition">Pelanggan</Link>
                <Link to="/map" className="block p-3 rounded hover:bg-gray-800 transition">Peta Jaringan</Link>
                
                {/* HANYA Pemilik & Admin yang bisa melihat NOC dan Billing */}
                {(user?.role === 'pemilik' || user?.role === 'admin') && (
                    <>
                        <Link to="/network" className="block p-3 rounded hover:bg-gray-800 transition font-bold text-blue-400">NOC Command Center</Link>
                        <Link to="/billing" className="block p-3 rounded hover:bg-gray-800 transition">Billing & Tagihan</Link>
                    </>
                )}

                {/* MENU RAHASIA: Dipindah ke deretan atas (Hanya untuk Pemilik) */}
                {user?.role === 'pemilik' && (
                    <div className="mt-6 border-t border-gray-700 pt-4">
                        <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Area Super Admin</p>
                        <Link to="/users" className="block p-3 rounded hover:bg-gray-800 transition">Manajemen Staf</Link>
                        <Link to="/logs" className="block p-3 rounded hover:bg-gray-800 transition text-red-400 font-bold">CCTV & Audit Logs</Link>
                    </div>
                )}
            </nav>

            {/* --- AREA BAWAH --- */}
            <div className="mt-auto pt-4">
                <p className="text-sm text-gray-400 mb-3 px-2">
                    Login sebagai: <span className="font-bold text-white uppercase">{user?.role || 'Guest'}</span>
                </p>
                <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded transition font-bold">
                    Keluar Sistem
                </button>
            </div>
        </div>
    );
};

export default Sidebar;