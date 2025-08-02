import axios from 'axios';
import { AuthResponse, Channel, Message, Server, CreateServerRequest, JoinServerResponse, InviteResponse, User } from '../types';

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

export const serverAPI = {
  getServers: (): Promise<Server[]> =>
    api.get('/api/servers').then(res => res.data),

  createServer: (data: CreateServerRequest): Promise<Server> =>
    api.post('/api/servers', data).then(res => res.data),

  getServer: (serverId: number): Promise<Server> =>
    api.get(`/api/servers/${serverId}`).then(res => res.data),

  joinServer: (inviteCode: string): Promise<JoinServerResponse> =>
    api.post(`/api/servers/join/${inviteCode}`).then(res => res.data),

  generateInvite: (serverId: number): Promise<InviteResponse> =>
    api.post(`/api/servers/${serverId}/invite`).then(res => res.data),
};

export const channelAPI = {
  // 获取服务器的频道列表
  getServerChannels: (serverId: number): Promise<Channel[]> =>
    api.get(`/api/servers/${serverId}/channels`).then(res => res.data),

  // 在服务器中创建频道
  createServerChannel: (serverId: number, name: string, description?: string): Promise<Channel> =>
    api.post(`/api/servers/${serverId}/channels`, { name, description }).then(res => res.data),

  // 保持向后兼容的API
  getChannels: (): Promise<Channel[]> =>
    api.get('/api/channels').then(res => res.data),

  createChannel: (name: string, description?: string): Promise<Channel> =>
    api.post('/api/channels', { name, description }).then(res => res.data),

  joinChannel: (channelId: number): Promise<{ message: string }> =>
    api.post(`/api/channels/${channelId}/join`).then(res => res.data),

  getMessages: (channelId: number): Promise<Message[]> =>
    api.get(`/api/channels/${channelId}/messages`).then(res => res.data),
};

export const userAPI = {
  updateProfile: (userData: Partial<User>): Promise<User> =>
    api.put('/api/user/profile', userData).then(res => res.data),

  uploadAvatar: (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/api/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
};

export default api;