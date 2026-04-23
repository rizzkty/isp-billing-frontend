import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Fungsi dinamis untuk mengatur class CSS berdasarkan status Aktif (Hover & Stay)
    const navClass = ({ isActive }) =>
        `block p-3 rounded-lg font-semibold transition-all duration-300 ease-out transform ${
            isActive
                ? 'bg-gray-800 text-blue-400 translate-x-2 shadow-lg border-l-4 border-blue-500'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:translate-x-1'
        }`;

    // Fungsi khusus untuk menu dengan warna highlight spesifik (NOC, Inbox, Notifikasi)
    const specialNavClass = ({ isActive, color }) => {
        const activeColors = {
            blue: 'text-blue-400 border-blue-500 shadow-blue-900/50',
            green: 'text-green-400 border-green-500 shadow-green-900/50',
            red: 'text-red-400 border-red-500 shadow-red-900/50',
            orange: 'text-orange-400 border-orange-500 shadow-orange-900/50',
        };
        const hoverColors = {
            blue: 'hover:text-blue-300 text-blue-500/70',
            green: 'hover:text-green-300 text-green-500/70',
            red: 'hover:text-red-300 text-red-500/70',
            orange: 'hover:text-orange-300 text-orange-500/70',
        };

        return `block p-3 rounded-lg font-bold transition-all duration-300 ease-out transform ${
            isActive
                ? `bg-gray-800 translate-x-2 shadow-lg border-l-4 ${activeColors[color]}`
                : `hover:bg-gray-800 hover:translate-x-1 ${hoverColors[color]}`
        }`;
    };

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen p-5 flex flex-col print:hidden shadow-2xl z-50">
            <div className="mb-8 pl-2">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 tracking-tighter">
                    NetBilling
                </h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Enterprise ISP</p>
            </div>
            
            {/* --- MENU UTAMA --- */}
            <nav className="flex-1 space-y-2.5">
                <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
                <NavLink to="/customers" className={navClass}>Pelanggan</NavLink>
                <NavLink to="/map" className={navClass}>Peta Jaringan</NavLink>
                
                {/* Menu Khusus Teknisi */}
                {(user?.role === 'teknisi') && (
                    <NavLink to="/inbox" className={(props) => specialNavClass({ ...props, color: 'green' })}>Inbox Tugas</NavLink>
                )}

                {/* HANYA Pemilik & Admin yang bisa melihat NOC dan Billing */}
                {(user?.role === 'pemilik' || user?.role === 'admin') && (
                    <>
                        <NavLink to="/ticketing" className={navClass}>Manajemen Ticketing</NavLink>
                        <NavLink to="/network" className={navClass}>NOC Command Center</NavLink>
                        <NavLink to="/billing" className={navClass}>Billing & Tagihan</NavLink>
                        <NavLink to="/laporan" className={navClass}>Laporan Keuangan</NavLink>
                        <NavLink to="/notifications" className={navClass}>Pusat Notifikasi</NavLink>
                    </>
                )}

                {/* MENU RAHASIA: (Hanya untuk Pemilik) */}
                {user?.role === 'pemilik' && (
                    <div className="mt-8 border-t border-gray-800 pt-5">
                        <p className="px-3 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Area Super Admin</p>
                        <div className="space-y-2.5">
                            <NavLink to="/users" className={navClass}>Manajemen Staf</NavLink>
                            <NavLink to="/logs" className={(props) => specialNavClass({ ...props, color: 'red' })}>CCTV & Audit Logs</NavLink>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- AREA BAWAH --- */}
            <div className="mt-auto pt-6 border-t border-gray-800">
                <div className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700 shadow-inner">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Akses Saat Ini</p>
                    <p className="font-bold text-white uppercase text-sm flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        {user?.role || 'Guest'}
                    </p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="w-full bg-red-600/90 hover:bg-red-500 text-white p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 font-bold flex items-center justify-center border border-red-500"
                >
                    Keluar Sistem
                </button>
            </div>
        </div>
    );
};

export default Sidebar;