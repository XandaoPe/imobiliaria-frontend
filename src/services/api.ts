import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (config.method === 'get') {
        config.params = {
            ...config.params,
            _t: Date.now(),
        };
    }

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
        if (error.response?.status === 401) {
            localStorage.clear(); // Limpa o lixo do cache
            window.location.href = '/login'; // Força o refresh
        }
        return Promise.reject(error);

});


export default api;