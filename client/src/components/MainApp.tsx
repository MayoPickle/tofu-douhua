import React, { useState, useEffect } from 'react';
import { Typography, message } from 'antd';

import ServerList from './ServerList';
import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import InviteModal from './InviteModal';
import { Channel, User, Server } from '../types';
import { serverAPI } from '../services/api';
import socketService from '../services/socket';

const { Text } = Typography;

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  // 服务器状态
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<Array<{
    id: string;
    userId: number;
    username: string;
    channelId: number;
  }>>([]);

  // 邀请模态框状态
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);

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

  const handleServerSelect = (server: Server) => {
    if (selectedServer?.id !== server.id) {
      // 离开当前服务器
      if (selectedServer) {
        socketService.leaveServer(selectedServer.id);
      }

      setSelectedServer(server);
      setSelectedChannel(null); // 切换服务器时清除选中的频道

      // 加入新服务器
      socketService.joinServer(server.id);

      // 如果在语音频道中，退出语音
      if (isInVoiceChannel) {
        handleLeaveVoice();
      }
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    if (selectedChannel?.id !== channel.id) {
      setSelectedChannel(channel);
    }
  };

  const handleShowInvite = () => {
    setIsInviteModalVisible(true);
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



  // 处理URL中的邀请码
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');

    if (inviteCode) {
      // 自动尝试加入服务器
      serverAPI.joinServer(inviteCode)
        .then((response) => {
          message.success(`成功加入服务器: ${response.server.name}`);
          // 清除URL参数
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          message.error(error.response?.data?.error || '加入服务器失败');
          // 清除URL参数
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

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
      {/* 服务器列表 */}
      <ServerList
        user={user}
        selectedServerId={selectedServer?.id || null}
        onServerSelect={handleServerSelect}
      />

      {/* 频道列表 */}
      <ChannelList
        selectedServer={selectedServer}
        onChannelSelect={handleChannelSelect}
        selectedChannelId={selectedChannel?.id || null}
        user={user}
        onLogout={handleLogout}
        onJoinVoice={handleJoinVoice}
        onShowInvite={handleShowInvite}
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

      {/* 邀请模态框 */}
      <InviteModal
        visible={isInviteModalVisible}
        onCancel={() => setIsInviteModalVisible(false)}
        server={selectedServer}
      />
    </div>
  );
};

export default MainApp;