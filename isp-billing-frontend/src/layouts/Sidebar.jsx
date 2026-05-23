import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Saya tambahkan import icon 'Server' di sini untuk menu Mikrotik dan 'Package'
import { LayoutDashboard, Users, Map, Inbox, Ticket, Activity, CreditCard, FileText, Bell, UserCog, Video, LogOut, ShieldAlert, Server, Package, Wallet, Settings } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Fungsi dinamis untuk mengatur class CSS berdasarkan status Aktif
    const navClass = ({ isActive }) =>
        `flex items-center p-3 rounded-xl font-semibold transition-all duration-300 ease-out transform ${
            isActive
                ? 'bg-gray-800 text-blue-400 translate-x-1 shadow-lg border-l-4 border-blue-500'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:translate-x-1'
        }`;

    // Fungsi khusus untuk menu dengan warna highlight spesifik
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

        return `flex items-center p-3 rounded-xl font-bold transition-all duration-300 ease-out transform ${
            isActive
                ? `bg-gray-800 translate-x-1 shadow-lg border-l-4 ${activeColors[color]}`
                : `hover:bg-gray-800 hover:translate-x-1 ${hoverColors[color]}`
        }`;
    };

    return (
        <div className="fixed top-0 left-0 h-screen z-[9999] bg-gray-900 text-white shadow-[10px_0_30px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out w-20 hover:w-72 print:hidden overflow-hidden flex flex-col group">
            
            {/* Header / Logo */}
            <div className="p-5 pt-6 mb-4 flex items-center whitespace-nowrap">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-blue-500/30">
                    N
                </div>
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 tracking-tighter">
                        NetBilling
                    </h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Enterprise ISP</p>
                </div>
            </div>
            
            {/* --- MENU UTAMA --- */}
            <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin px-3">
                <NavLink to="/dashboard" className={navClass}><LayoutDashboard className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Dashboard</span></NavLink>
                <NavLink to="/customers" className={navClass}><Users className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Pelanggan</span></NavLink>
                <NavLink to="/map" className={navClass}><Map className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Peta Jaringan</span></NavLink>
                
                {/* Menu Khusus Teknisi */}
                {(user?.role === 'teknisi') && (
                    <NavLink to="/inbox" className={(props) => specialNavClass({ ...props, color: 'green' })}><Inbox className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Inbox Tugas</span></NavLink>
                )}

                {/* HANYA Pemilik & Admin yang bisa melihat NOC dan Billing */}
                {(user?.role === 'pemilik' || user?.role === 'admin') && (
                    <>
                        <NavLink to="/ticketing" className={navClass}><Ticket className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Manajemen Ticketing</span></NavLink>
                        <NavLink to="/network" className={navClass}><Activity className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">NOC Command Center</span></NavLink>
                        
                        {/* Menu Integrasi Mikrotik yang sudah diperbaiki */}
                        <NavLink to="/mikrotik" className={navClass}><Server className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Integrasi Mikrotik</span></NavLink>
                        
                        <NavLink to="/payment-settings" className={navClass}><Wallet className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Payment Gateway</span></NavLink>
                        
                        <NavLink to="/packages" className={navClass}><Package className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Paket Layanan</span></NavLink>
                        <NavLink to="/billing" className={navClass}><CreditCard className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Billing & Tagihan</span></NavLink>
                        <NavLink to="/laporan" className={navClass}><FileText className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Laporan Keuangan</span></NavLink>
                        <NavLink to="/notifications" className={navClass}><Bell className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Pusat Notifikasi</span></NavLink>
                        <NavLink to="/notification-settings" className={navClass}><Settings className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Pengaturan Notifikasi</span></NavLink>
                    </>
                )}

                {/* MENU RAHASIA: (Hanya untuk Pemilik) */}
                {user?.role === 'pemilik' && (
                    <div className="mt-8 border-t border-gray-800 pt-5">
                        <p className="px-3 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Area Super Admin</p>
                        <div className="space-y-2">
                            <NavLink to="/users" className={navClass}><UserCog className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Manajemen Staf</span></NavLink>
                            <NavLink to="/logs" className={(props) => specialNavClass({ ...props, color: 'red' })}><Video className="w-5 h-5 shrink-0"/> <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">CCTV & Audit Logs</span></NavLink>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- AREA BAWAH --- */}
            <div className="mt-auto pt-6 pb-4 px-3 border-t border-gray-800">
                <div className="flex items-center p-3 mb-4 rounded-xl bg-gray-800 border border-gray-700 shadow-inner overflow-hidden whitespace-nowrap">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-green-500 animate-pulse"/>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Akses Saat Ini</p>
                        <p className="font-bold text-white uppercase text-sm">{user?.role || 'Guest'}</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center justify-center p-3 rounded-xl bg-red-600/90 hover:bg-red-500 text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 font-bold border border-red-500 overflow-hidden whitespace-nowrap"
                >
                    <LogOut className="w-5 h-5 shrink-0"/>
                    <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">Keluar Sistem</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;