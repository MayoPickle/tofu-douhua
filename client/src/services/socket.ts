import { io, Socket } from 'socket.io-client';
import { Message, User, WebRTCSignal } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private currentUser: User | null = null;

  connect(user: User) {
    this.currentUser = user;
    // 使用当前页面的协议和主机，让Socket.IO自动连接到正确的地址
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket?.emit('user-joined', user);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChannel(channelId: number) {
    this.socket?.emit('join-channel', channelId);
  }

  leaveChannel(channelId: number) {
    this.socket?.emit('leave-channel', channelId);
  }

  sendMessage(channelId: number, content: string) {
    if (this.currentUser) {
      this.socket?.emit('send-message', {
        channelId,
        content,
        userId: this.currentUser.id
      });
    }
  }

  sendWebRTCSignal(signal: any, channelId: number) {
    if (this.currentUser) {
      this.socket?.emit('webrtc-signal', {
        signal,
        channelId,
        userId: this.currentUser.id
      });
    }
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('new-message', callback);
  }

  onWebRTCSignal(callback: (data: WebRTCSignal) => void) {
    this.socket?.on('webrtc-signal', callback);
  }

  onUserOnline(callback: (user: User) => void) {
    this.socket?.on('user-online', callback);
  }

  onUserOffline(callback: (user: User) => void) {
    this.socket?.on('user-offline', callback);
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();