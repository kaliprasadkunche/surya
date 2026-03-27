import axios from 'axios';
import { Media, AuthResponse, ContactMessage, Profile } from '../types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle Firestore JSON errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      // The server returns { error: '...' } or { error: { ... } }
      if (data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        return Promise.reject(new Error(errorMsg));
      }
    }
    return Promise.reject(error);
  }
);

export const mediaService = {
  getAll: async (type?: string, category?: string) => {
    const response = await api.get<Media[]>('/media', { params: { type, category } });
    return response.data;
  },
  upload: async (formData: FormData) => {
    const response = await api.post<Media>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/media/${id}`);
  },
};

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post<AuthResponse>('/admin/login', credentials);
    localStorage.setItem('admin_token', response.data.token);
    localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },
  isAuthenticated: () => !!localStorage.getItem('admin_token'),
};

export const contactService = {
  send: async (message: Omit<ContactMessage, 'createdAt'>) => {
    await api.post('/contact', message);
  },
  getAll: async () => {
    const response = await api.get<ContactMessage[]>('/messages');
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/messages/${id}`);
  },
};

export const profileService = {
  get: async () => {
    const response = await api.get<Profile[]>('/profile');
    return response.data[0] || null;
  },
  update: async (profile: Partial<Profile>) => {
    const response = await api.post<Profile>('/profile', profile);
    return response.data;
  },
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  uploadProfilePic: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/upload-profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
