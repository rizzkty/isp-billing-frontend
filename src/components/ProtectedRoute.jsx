import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    // Jika belum login, lempar ke halaman login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Jika role user saat ini TIDAK ADA di dalam daftar role yang diizinkan
    if (!allowedRoles.includes(user.role)) {
        alert("Akses Ditolak: Anda tidak memiliki izin untuk melihat halaman ini.");
        return <Navigate to="/dashboard" replace />;
    }

    // Jika aman, persilakan masuk (tampilkan halamannya)
    return children;
};

export default ProtectedRoute;