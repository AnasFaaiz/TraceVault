import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send httpOnly refresh cookie
});

// Interceptor to add JWT token to request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 errors.
// Helper to call refresh endpoint without triggering interceptors
const rawAxios = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: true,
});

async function tryRefresh() {
  try {
    const resp = await rawAxios.post('/auth/refresh');
    const { accessToken, user } = resp.data || {};
    if (accessToken) {
      useAuthStore.getState().setAuth(user, accessToken);
      return accessToken;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      if (typeof window !== 'undefined') {
        const logout = useAuthStore.getState().logout;
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
