import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import portalApi from '../portalApi';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading]   = useState(true);

  // Restore session dari localStorage saat pertama load
  useEffect(() => {
    const token    = localStorage.getItem('portal_token');
    const stored   = localStorage.getItem('portal_customer');

    if (token && stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        localStorage.removeItem('portal_customer');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Simpan session setelah verify magic link berhasil
   */
  const login = useCallback((token, customerData) => {
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_customer', JSON.stringify(customerData));
    setCustomer(customerData);
  }, []);

  /**
   * Logout: hapus session
   */
  const logout = useCallback(async () => {
    try {
      await portalApi.post('/auth/logout');
    } catch {
      // Tetap logout meskipun request gagal
    }
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_customer');
    setCustomer(null);
  }, []);

  /**
   * Refresh data customer dari server
   */
  const refreshCustomer = useCallback(async () => {
    try {
      const res = await portalApi.get('/me');
      if (res.data?.customer) {
        const updated = res.data.customer;
        localStorage.setItem('portal_customer', JSON.stringify(updated));
        setCustomer(updated);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const isLoggedIn = !!customer && !!localStorage.getItem('portal_token');

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoggedIn, loading, login, logout, refreshCustomer }}>
      <Outlet />
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth harus dipakai di dalam CustomerAuthProvider');
  return ctx;
}

export default CustomerAuthContext;
