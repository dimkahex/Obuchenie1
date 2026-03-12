import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const API = axios.create({ baseURL: API_BASE, timeout: 10000 });

// Подставляем токен в каждый запрос, если пользователь залогинен
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(err);
  }
);
