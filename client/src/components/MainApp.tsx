import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Button, Dropdown, Space, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import { Channel, User } from '../types';
import socketService from '../services/socket';

const { Header, Content } = Layout;
const { Text } = Typography;

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<Array<{
    id: string;
    userId: number;
    username: string;
    channelId: number;
  }>>([]);
  const [autoJoinVoice, setAutoJoinVoice] = useState<number | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    onLogout();
  };

  const handleChannelSelect = (channel: Channel) => {
    if (selectedChannel?.id !== channel.id) {
      setSelectedChannel(channel);
    }
  };

  const handleJoinVoice = async (channelId: number) => {
    try {
      console.log(`加入语音频道: ${channelId}`);
      
      // 将当前用户添加到连接列表中
      const currentUserConnection = {
        id: `current-user-${user.id}`,
        userId: user.id,
        username: user.username,
        channelId: channelId
      };
      
      setConnectedUsers(prev => {
        // 先移除用户在其他频道的连接
        const filteredUsers = prev.filter(u => u.userId !== user.id);
        // 添加到新频道
        return [...filteredUsers, currentUserConnection];
      });
      
      // 触发ChatArea中的语音连接
      setAutoJoinVoice(channelId);
      
    } catch (error) {
      console.error('加入语音频道失败:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  useEffect(() => {
    socketService.connect(user);
    
    // 监听用户连接事件
    const handleUserConnected = (data: { id: string; userId: number; username: string; channelId: number }) => {
      setConnectedUsers(prev => {
        const exists = prev.find(u => u.id === data.id);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    };

    // 监听用户断开连接事件
    const handleUserDisconnected = (data: { id: string }) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== data.id));
    };

    // 监听频道用户列表更新
    const handleChannelUsersUpdate = (data: { channelId: number; users: Array<{ id: string; userId: number; username: string }> }) => {
      setConnectedUsers(prev => {
        // 移除该频道的旧用户
        const filteredUsers = prev.filter(u => u.channelId !== data.channelId);
        // 添加新的用户列表
        const newUsers = data.users.map(user => ({
          ...user,
          channelId: data.channelId
        }));
        return [...filteredUsers, ...newUsers];
      });
    };

    // 注册事件监听器（这些事件需要在后端实现）
    // socketService.on('userConnected', handleUserConnected);
    // socketService.on('userDisconnected', handleUserDisconnected);
    // socketService.on('channelUsersUpdate', handleChannelUsersUpdate);
    
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      backgroundColor: '#36393f'
    }}>
      {/* 左侧服务器栏 */}
      <div style={{
        width: 72,
        backgroundColor: '#202225',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0'
      }}>
        {/* 服务器图标 */}
        <div style={{
          width: 48,
          height: 48,
          backgroundColor: '#5865f2',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          cursor: 'pointer',
          transition: 'border-radius 0.2s ease',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderRadius = '12px';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderRadius = '16px';
        }}>
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 18, 
            fontWeight: 600 
          }}>
            豆
          </Text>
        </div>
        
        {/* 分隔线 */}
        <div style={{
          width: 32,
          height: 2,
          backgroundColor: '#36393f',
          borderRadius: 1,
          marginBottom: 8
        }} />
      </div>

      {/* 频道列表 */}
      <ChannelList 
        onChannelSelect={handleChannelSelect}
        selectedChannelId={selectedChannel?.id || null}
        user={user}
        onLogout={handleLogout}
        onJoinVoice={handleJoinVoice}
        connectedUsers={connectedUsers}
      />

      {/* 主内容区域 */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column'
      }}>
        <ChatArea 
          channel={selectedChannel}
          user={user}
          autoJoinVoice={autoJoinVoice}
          onVoiceJoined={() => setAutoJoinVoice(null)}
        />
      </div>
    </div>
  );
};

export default MainApp;