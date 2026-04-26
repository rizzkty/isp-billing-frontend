import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Interceptor untuk menyisipkan Token di setiap request
api.interceptors.request.use((config) => {
    try {
        const authData = localStorage.getItem('isp_auth');
        if (authData) {
            const { token } = JSON.parse(authData);
            if (token) {
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

// Interceptor untuk menangani error 401 (Token kadaluarsa/tidak valid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Hindari redirect loop jika sudah di halaman login
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('isp_auth');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
