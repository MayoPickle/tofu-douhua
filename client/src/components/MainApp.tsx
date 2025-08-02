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
        />
      </div>
    </div>
  );
};

export default MainApp;