// api.ts - Versão simplificada temporária
import axios from 'axios';

export const API_URL = 'https://imobiliaria-backend-i8ew.onrender.com';

export const api = axios.create({
    baseURL: API_URL,
    // REMOVA todos os headers personalizados temporariamente
    // headers: {
    //   'Cache-Control': 'no-cache',
    //   'Pragma': 'no-cache',
    //   'Expires': '0',
    // }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    // Remova o cache buster temporariamente
    // if (config.method === 'get') {
    //   config.params = {
    //     ...config.params,
    //     _t: Date.now(),
    //   };
    // }

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;