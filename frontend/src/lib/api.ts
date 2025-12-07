import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8002/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401, it means the token is invalid or expired.
      // We should clear the token.
      // The AuthContext will need to handle redirecting to login, 
      // but clearing the token here ensures subsequent requests don't send a bad token.
      localStorage.removeItem('access_token');
      // Optionally reload the page or dispatch a custom event if the app needs to react immediately
      // window.location.href = '/auth'; // Crude redirection if needed
    }
    return Promise.reject(error);
  }
);

export default api;