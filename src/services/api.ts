import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_URL
});

// Este interceptor garante que TODA vez que o Dashboard chamar a API,
// ele pegará o token mais atualizado do localStorage
// api.interceptors.request.use((config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    // Verifique se config e config.headers existem antes de atribuir
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    // Adicione um log de erro para ver no inspetor se conseguir conectar o cabo
    console.error("Erro no interceptor:", error);
    return Promise.reject(error);
});


export default api;