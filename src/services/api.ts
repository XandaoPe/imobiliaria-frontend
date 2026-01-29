import axios from 'axios';

// export const API_URL = 'http://localhost:5000';
export const API_URL = 'https://imobiliaria-backend-i8ew.onrender.com';

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

export default api;