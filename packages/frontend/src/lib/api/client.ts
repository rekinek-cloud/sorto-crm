import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

// API base URL - handle cases where URL already contains /api
const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : rawBaseURL;
const apiPath = rawBaseURL.includes('/api') ? '/v1' : '/api/v1';

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${baseURL}${apiPath}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${baseURL}${apiPath}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          
          // Update cookies
          Cookies.set('access_token', accessToken, { expires: 1 }); // 1 day
          Cookies.set('refresh_token', newRefreshToken, { expires: 7 }); // 7 days

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        // Use replace to avoid history/security issues
        if (typeof window !== 'undefined') {
          try {
            window.location.replace('/auth/login');
          } catch (e) {
            // Fallback if replace fails
            console.error('Failed to redirect:', e);
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      // Don't show toast for 404 - let individual components handle it
      console.log('API 404:', error.config?.url);
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: AxiosError) => {
  if (error.response?.data) {
    const errorData = error.response.data as any;
    if (errorData.error) {
      return errorData.error;
    }
    if (errorData.message) {
      return errorData.message;
    }
  }
  return error.message || 'An unexpected error occurred';
};

// Generic API response type
export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

// Pagination response type
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default apiClient;