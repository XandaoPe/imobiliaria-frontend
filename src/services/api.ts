import axios from 'axios';

// Verifica se está em desenvolvimento local ou produção
const getApiUrl = () => {
    // Se estiver rodando no localhost (desenvolvimento)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }

    // Se a variável de ambiente estiver definida (Vercel)
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // Fallback para Render (produção)
    return 'https://imobiliaria-backend-i8ew.onrender.com';
};

export const API_URL = getApiUrl();

console.log('API URL sendo usada:', API_URL); // Para debug

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
        localStorage.clear();
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;