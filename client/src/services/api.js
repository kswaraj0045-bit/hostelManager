import axios from 'axios';
import { resolveApiBaseUrl } from '../utils/serverUrl.js';

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    // Only redirect to login if the 401 is NOT from the auth endpoints themselves
    if (err.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/me')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
