import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar di sebelah kiri */}
            <Sidebar />
            
            {/* Area Konten Utama di sebelah kanan */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto">
                <Outlet /> {/* Ini adalah tempat halaman berubah-ubah */}
            </div>
        </div>
    );
};

export default DashboardLayout;