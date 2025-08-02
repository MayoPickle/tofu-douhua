import axios from 'axios';
import { AuthResponse, Channel, Message } from '../types';

// 使用相对路径，通过Vite代理转发到后端
const api = axios.create({
  baseURL: '',
  timeout: 10000, // 10 seconds timeout
});

api.interceptors.request.use((config) => {
  console.log('Making request to:', config.url, 'with data:', config.data);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email: string, password: string, username: string): Promise<AuthResponse> =>
    api.post('/api/register', { email, password, username }).then(res => res.data),
  
  login: (email: string, password: string): Promise<AuthResponse> =>
    api.post('/api/login', { email, password }).then(res => res.data),
};

export const channelAPI = {
  getChannels: (): Promise<Channel[]> =>
    api.get('/api/channels').then(res => res.data),
  
  createChannel: (name: string, description?: string): Promise<Channel> =>
    api.post('/api/channels', { name, description }).then(res => res.data),
  
  joinChannel: (channelId: number): Promise<{ message: string }> =>
    api.post(`/api/channels/${channelId}/join`).then(res => res.data),
  
  getMessages: (channelId: number): Promise<Message[]> =>
    api.get(`/api/channels/${channelId}/messages`).then(res => res.data),
};

export default api;