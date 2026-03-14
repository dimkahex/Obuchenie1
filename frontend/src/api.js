import axios from 'axios';

// URL API: из переменной сборки или по текущему хосту (работает при открытии по IP VM)
function getApiBase() {
  const env = import.meta.env.VITE_API_URL;
  if (env && String(env).trim()) return String(env).replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }
  return '/api';
}

const API_BASE = getApiBase();
export const API = axios.create({ baseURL: API_BASE, timeout: 15000 });

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
