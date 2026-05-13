import axios from 'axios';

// Axios instance khusus untuk portal customer
// Terpisah dari api.js admin agar tidak tercampur session/token
const portalApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/portal`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Otomatis sertakan token session customer di setiap request
portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — session expired → redirect ke portal login
portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_customer');
      // Redirect ke portal login
      if (window.location.pathname.startsWith('/portal') &&
          !window.location.pathname.includes('/portal/login') &&
          !window.location.pathname.includes('/portal/verify')) {
        window.location.href = '/portal/login';
      }
    }
    return Promise.reject(error);
  }
);

export default portalApi;
