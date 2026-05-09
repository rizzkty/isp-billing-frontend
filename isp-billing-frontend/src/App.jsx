import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Import Layout & Penjaga Pintu
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

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
import LaporanKeuangan from './pages/LaporanKeuangan';
// INI YANG SEBELUMNYA HILANG:
import MikrotikSettings from './pages/MikrotikSettings'; 
import RadiusSessions from './pages/RadiusSessions';
import Packages from './pages/Packages';

// Import Halaman Khusus Super Admin
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
          <Routes>
            {/* Rute Publik */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />

            {/* Rute yang dibungkus dengan Layout (Punya Sidebar) */}
            <Route element={<DashboardLayout />}>

              {/* Bebas Diakses Semua Role (TAPI WAJIB LOGIN) */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin', 'teknisi']}><Dashboard /></ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin', 'teknisi']}><Customers /></ProtectedRoute>
              } />
              <Route path="/map" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin', 'teknisi']}><MapNetwork /></ProtectedRoute>
              } />
              <Route path="/ticketing" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin', 'teknisi']}><Ticketing /></ProtectedRoute>
              } />
              <Route path="/inbox" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin', 'teknisi']}><InboxTeknisi /></ProtectedRoute>
              } />

              {/* HANYA Admin dan Pemilik */}
              <Route path="/network" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><NetworkMonitoring /></ProtectedRoute>
              } />
              <Route path="/radius/sessions" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><RadiusSessions /></ProtectedRoute>
              } />
              <Route path="/mikrotik" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><MikrotikSettings /></ProtectedRoute>
              } />
              <Route path="/packages" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><Packages /></ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><Billing /></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><Notifications /></ProtectedRoute>
              } />
              <Route path="/laporan" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><LaporanKeuangan /></ProtectedRoute>
              } />

              {/* HANYA Super Admin (Pemilik) */}
              <Route path="/logs" element={
                <ProtectedRoute allowedRoles={['pemilik']}><AuditLogs /></ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['pemilik']}><Users /></ProtectedRoute>
              } />

            </Route>
          </Routes>
        </Router>
      </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;