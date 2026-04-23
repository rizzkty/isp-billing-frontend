import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import Layout & Penjaga Pintu
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Import Halaman Utama
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import MapNetwork from './pages/MapNetwork';
import Ticketing from './pages/Ticketing';
import InboxTeknisi from './pages/InboxTeknisi';

// Import Halaman Admin & Pemilik
import NetworkMonitoring from './pages/NetworkMonitoring';
import Billing from './pages/Billing';
import Notifications from './pages/Notifications';

// Import Halaman Khusus Super Admin
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rute Publik */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rute yang dibungkus dengan Layout (Punya Sidebar) */}
          <Route element={<DashboardLayout />}>
            
            {/* Bebas Diakses Semua Role */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/map" element={<MapNetwork />} />
            <Route path="/ticketing" element={<Ticketing />} />
            <Route path="/inbox" element={<InboxTeknisi />} />
            
            {/* HANYA Admin dan Pemilik */}
            <Route path="/network" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}>
                    <NetworkMonitoring />
                </ProtectedRoute>
            } />
            <Route path="/billing" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}>
                    <Billing />
                </ProtectedRoute>
            } />
            <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}>
                    <Notifications />
                </ProtectedRoute>
            } />

            {/* HANYA Super Admin (Pemilik) */}
            <Route path="/logs" element={
                <ProtectedRoute allowedRoles={['pemilik']}>
                    <AuditLogs />
                </ProtectedRoute>
            } />
            <Route path="/users" element={
                <ProtectedRoute allowedRoles={['pemilik']}>
                    <Users />
                </ProtectedRoute>
            } />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;