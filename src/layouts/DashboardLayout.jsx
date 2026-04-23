import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-gray-50 print:bg-white overflow-hidden selection:bg-blue-200">
            {/* Sidebar di sebelah kiri */}
            <Sidebar />
            
            {/* Area Konten Utama di sebelah kanan */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible">
                {/* Kunci Animasi: 'key' akan berubah setiap URL berubah, memaksa React me-render ulang div ini dan memutar ulang animasi 'animate-fadeIn' */}
                <div key={location.pathname} className="animate-fadeIn w-full h-full">
                    <Outlet /> {/* Ini adalah tempat halaman berubah-ubah */}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;