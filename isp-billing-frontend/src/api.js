import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Interceptor untuk menyisipkan Token di setiap request
api.interceptors.request.use((config) => {
    const authData = localStorage.getItem('isp_auth');
    if (authData) {
        const { token } = JSON.parse(authData);
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor untuk menangani error 401 (Token kadaluarsa)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('isp_auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
