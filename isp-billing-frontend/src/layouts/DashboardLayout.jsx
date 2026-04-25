import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-gray-50 print:bg-white overflow-hidden selection:bg-blue-200">
            {/* Spacer untuk Sidebar yang menciut (w-20) */}
            <div className="w-20 shrink-0 print:hidden transition-all duration-300 z-0"></div>
            
            {/* Sidebar Fixed */}
            <Sidebar />
            
            {/* Area Konten Utama */}
            <div className="flex-1 h-screen overflow-x-hidden overflow-y-auto print:overflow-visible relative z-10">
                {/* Kunci Animasi */}
                <div key={location.pathname} className="animate-fadeIn w-full h-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;