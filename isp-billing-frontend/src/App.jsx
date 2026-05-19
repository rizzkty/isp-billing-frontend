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
import MikrotikSettings from './pages/MikrotikSettings';
import PaymentSettings from './pages/PaymentSettings';
import Packages from './pages/Packages';

// Import Halaman Khusus Super Admin
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';

// ===== CLIENT PORTAL IMPORTS =====
import { CustomerAuthProvider } from './portal/context/CustomerAuthContext';
import PortalLayout from './portal/layouts/PortalLayout';
import PortalLogin from './portal/pages/PortalLogin';
import PortalVerify from './portal/pages/PortalVerify';
import PortalDashboard from './portal/pages/PortalDashboard';
import PortalInvoices from './portal/pages/PortalInvoices';
import PortalInvoiceDetail from './portal/pages/PortalInvoiceDetail';
import PaymentSuccess from './portal/pages/PaymentSuccess';
import PaymentFailed from './portal/pages/PaymentFailed';
import PortalTickets from './portal/pages/PortalTickets';
// Portal CSS
import './portal/portal.css';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>

            {/* ============================================
                ADMIN ROUTES — pakai AuthProvider & DashboardLayout
            ============================================ */}
            <Route path="/" element={<AuthProvider><Navigate to="/login" /></AuthProvider>} />
            <Route path="/login" element={<AuthProvider><Login /></AuthProvider>} />

            <Route element={<AuthProvider><DashboardLayout /></AuthProvider>}>
              {/* Bebas Diakses Semua Role (WAJIB LOGIN) */}
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
              <Route path="/mikrotik" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><MikrotikSettings /></ProtectedRoute>
              } />
              <Route path="/payment-settings" element={
                <ProtectedRoute allowedRoles={['pemilik', 'admin']}><PaymentSettings /></ProtectedRoute>
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

            {/* ============================================
                CLIENT PORTAL ROUTES — pakai CustomerAuthProvider
                Terpisah sepenuhnya dari admin session
            ============================================ */}
            <Route path="/portal" element={<CustomerAuthProvider />}>
              {/* Public portal routes (no auth needed) */}
              <Route path="login" element={
                <PortalLayout requireAuth={false}><PortalLogin /></PortalLayout>
              } />
              <Route path="verify" element={
                <PortalLayout requireAuth={false}><PortalVerify /></PortalLayout>
              } />
              <Route path="payment/success" element={
                <PortalLayout requireAuth={false}><PaymentSuccess /></PortalLayout>
              } />
              <Route path="payment/failed" element={
                <PortalLayout requireAuth={false}><PaymentFailed /></PortalLayout>
              } />

              {/* Protected portal routes (customer must be logged in) */}
              <Route path="dashboard" element={
                <PortalLayout><PortalDashboard /></PortalLayout>
              } />
              <Route path="invoices" element={
                <PortalLayout><PortalInvoices /></PortalLayout>
              } />
              <Route path="invoices/:id" element={
                <PortalLayout><PortalInvoiceDetail /></PortalLayout>
              } />
              <Route path="tickets" element={
                <PortalLayout><PortalTickets /></PortalLayout>
              } />

              {/* Default /portal → redirect ke login */}
              <Route index element={<Navigate to="/portal/login" replace />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;