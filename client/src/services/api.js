import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = localStorage.getItem('fk_access_token') || null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('fk_access_token', token);
  } else {
    localStorage.removeItem('fk_access_token');
  }
};

export const getAccessToken = () => accessToken;

// Request interceptor to inject Bearer token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        if (res.data && res.data.data && res.data.data.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        setAccessToken(null);
        window.dispatchEvent(new Event('fk_auth_logout'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
