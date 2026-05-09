import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`,
    withCredentials: true, // Enable cookie-based (stateful) authentication for Sanctum
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

// Interceptor untuk menyisipkan Token di setiap request (fallback untuk legacy token auth)
api.interceptors.request.use((config) => {
    try {
        const authData = localStorage.getItem('isp_auth');
        if (authData) {
            const { token } = JSON.parse(authData);
            // Hanya tambah token jika ada dan belum ada Authorization header
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (e) {
        // Token korup di localStorage — hapus dan paksa login ulang
        console.warn('Token tidak valid, membersihkan sesi...');
        localStorage.removeItem('isp_auth');
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor untuk menangani error 401 dan session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Hindari redirect loop jika sudah di halaman login
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('isp_auth');
                window.location.href = '/login?session=expired';
            }
        }
        
        // Handle 403 Forbidden (insufficient permissions)
        if (error.response && error.response.status === 403) {
            console.error('Access Forbidden:', error.response.data?.message);
        }
        
        return Promise.reject(error);
    }
);

export default api;
