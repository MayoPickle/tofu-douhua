export interface User {
  id: number;
  email: string;
  username: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Channel {
  id: number;
  name: string;
  description: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
}

export interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WebRTCSignal {
  signal: any;
  from: string;
  userId: number;
  channelId: number;
}