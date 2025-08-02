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
    <Layout style={{ height: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          豆腐花语音聊天
        </div>
        
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" style={{ color: 'white', height: 'auto' }}>
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#87d068' }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ textAlign: 'left' }}>
                <div>{user.username}</div>
                <Text style={{ color: '#rgba(255,255,255,0.65)', fontSize: 12 }}>
                  {user.email}
                </Text>
              </div>
            </Space>
          </Button>
        </Dropdown>
      </Header>

      <Layout>
        <Content style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
          <ChannelList 
            onChannelSelect={handleChannelSelect}
            selectedChannelId={selectedChannel?.id || null}
          />
          <ChatArea 
            channel={selectedChannel}
            user={user}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainApp;