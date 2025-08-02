import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';

import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import { Channel, User } from '../types';
import socketService from '../services/socket';

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


  // 语音控制状态
  const [isInVoiceChannel, setIsInVoiceChannel] = useState(false);
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState<number | null>(null);
  const [currentVoiceChannelName, setCurrentVoiceChannelName] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

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

  const handleJoinVoice = async (channelId: number, channelName: string) => {
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

      // 设置语音频道状态
      setIsInVoiceChannel(true);
      setCurrentVoiceChannelId(channelId);
      setCurrentVoiceChannelName(channelName);



    } catch (error) {
      console.error('加入语音频道失败:', error);
    }
  };

  // 退出语音频道
  const handleLeaveVoice = () => {
    console.log('退出语音频道');

    // 清除语音状态
    setIsInVoiceChannel(false);
    setCurrentVoiceChannelId(null);
    setCurrentVoiceChannelName('');
    setIsMuted(false);
    setIsDeafened(false);

    // 从连接用户列表中移除当前用户
    setConnectedUsers(prev => prev.filter(u => u.userId !== user.id));


  };

  // 切换静音状态
  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    console.log('切换静音状态:', !isMuted);
  };

  // 切换禁听状态
  const handleToggleDeafen = () => {
    const newDeafenState = !isDeafened;
    setIsDeafened(newDeafenState);
    // 如果启用禁听，同时启用静音
    if (newDeafenState) {
      setIsMuted(true);
    }
    console.log('切换禁听状态:', newDeafenState);
  };



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
        onJoinVoice={handleJoinVoice}
        connectedUsers={connectedUsers}
        isInVoiceChannel={isInVoiceChannel}
        currentVoiceChannelId={currentVoiceChannelId}
        currentVoiceChannelName={currentVoiceChannelName}
        onLeaveVoice={handleLeaveVoice}
        isMuted={isMuted}
        isDeafened={isDeafened}
        onToggleMute={handleToggleMute}
        onToggleDeafen={handleToggleDeafen}
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