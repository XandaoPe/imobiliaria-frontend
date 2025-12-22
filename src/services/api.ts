import axios from 'axios';

// Detecta automaticamente o ambiente
const getApiUrl = () => {
    const hostname = window.location.hostname;
    const isLocal =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||  // Rede local
        hostname.startsWith('10.0.') ||     // Rede local
        hostname === '[::1]';               // IPv6 localhost

    console.log('🌍 Hostname:', hostname);
    console.log('🔍 É local?', isLocal);

    if (isLocal) {
        return 'http://localhost:5000'; // Backend local
    }

    return 'https://imobiliaria-backend-i8ew.onrender.com'; // Produção
};

export const API_URL = getApiUrl();
console.log('🚀 API URL Configurada:', API_URL);

export const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

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

// Interceptor de resposta para debug
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ Erro na API:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export default api;