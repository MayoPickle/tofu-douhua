import React, { useState, useEffect } from 'react';
import { Button, Form, message, Typography, Avatar, Dropdown } from 'antd';
import { PlusOutlined, SoundOutlined, LogoutOutlined, UserOutlined, SettingOutlined, AudioOutlined, AudioMutedOutlined, PhoneOutlined, SoundFilled, StopOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Channel, Server } from '../types';
import { channelAPI } from '../services/api';
import UserProfile from './UserProfile';
import DiscordModal from './DiscordModal';
import DiscordButton from './DiscordButton';
import DiscordText from './DiscordText';
import { DiscordInput, DiscordTextArea } from './DiscordInput';

const { Text } = Typography;

interface ChannelListProps {
  selectedServer: Server | null;
  onChannelSelect: (channel: Channel) => void;
  selectedChannelId: number | null;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  onLogout?: () => void;
  onJoinVoice?: (channelId: number, channelName: string) => void;
  onShowInvite?: () => void;
  connectedUsers?: Array<{
    id: string;
    userId: number;
    username: string;
    channelId: number;
  }>;
  // 语音控制相关
  isInVoiceChannel?: boolean;
  currentVoiceChannelId?: number | null;
  currentVoiceChannelName?: string;
  onLeaveVoice?: () => void;
  isMuted?: boolean;
  isDeafened?: boolean;
  onToggleMute?: () => void;
  onToggleDeafen?: () => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
  selectedServer,
  onChannelSelect,
  selectedChannelId,
  user,
  onLogout,
  onJoinVoice,
  onShowInvite,
  connectedUsers,
  isInVoiceChannel,
  currentVoiceChannelName,
  onLeaveVoice,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isProfileVisible, setIsProfileVisible] = useState(false);

  const fetchChannels = async () => {
    if (!selectedServer) {
      setChannels([]);
      return;
    }

    try {
      const channelList = await channelAPI.getServerChannels(selectedServer.id);
      setChannels(channelList);
    } catch (error) {
      message.error('获取频道列表失败');
    }
  };

  const handleCreateChannel = async (values: { name: string; description?: string }) => {
    if (!selectedServer) {
      message.error('请先选择一个服务器');
      return;
    }

    setLoading(true);
    try {
      const newChannel = await channelAPI.createServerChannel(selectedServer.id, values.name, values.description);
      setChannels([...channels, newChannel]);
      setIsModalVisible(false);
      form.resetFields();
      message.success('频道创建成功！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建频道失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async (channel: Channel) => {
    try {
      await channelAPI.joinChannel(channel.id);
      onChannelSelect(channel);
      // 自动加入语音频道
      if (onJoinVoice) {
        onJoinVoice(channel.id, channel.name);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        onChannelSelect(channel);
        // 即使已经在频道中，也尝试加入语音
        if (onJoinVoice) {
          onJoinVoice(channel.id, channel.name);
        }
      } else {
        message.error('加入频道失败');
      }
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [selectedServer]);

  return (
    <div style={{ 
      width: 240, 
      backgroundColor: '#2f3136', 
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* 服务器头部 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #202225',
        backgroundColor: '#2f3136'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <DiscordText
            weight="semibold"
            size="lg"
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {selectedServer?.name || '选择服务器'}
          </DiscordText>
          {selectedServer && onShowInvite && (
            <Button
              type="text"
              size="small"
              icon={<ShareAltOutlined />}
              onClick={onShowInvite}
              style={{
                color: '#8e9297',
                padding: '4px 8px',
                height: 'auto',
                minWidth: 'auto'
              }}
              title="邀请朋友"
            />
          )}
        </div>
      </div>

      {/* 频道列表 */}
      <div style={{
        flex: 1,
        padding: '16px 8px',
        overflowY: 'auto'
      }}>
        {!selectedServer ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center'
          }}>
            <DiscordText variant="muted">
              请从左侧选择一个服务器
            </DiscordText>
          </div>
        ) : (
          <>
            {/* 语音频道分类 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              marginBottom: 8
            }}>
              <DiscordText
                variant="muted"
                size="sm"
                weight="semibold"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}
              >
                语音频道
              </DiscordText>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
                style={{
                  color: '#8e9297',
                  padding: 0,
                  width: 18,
                  height: 18,
                  minWidth: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
            }}
          />
        </div>

        {/* 频道项目 */}
        {channels.map((channel) => {
          const channelUsers = connectedUsers?.filter(user => user.channelId === channel.id) || [];
          const isActive = selectedChannelId === channel.id;
          
          return (
            <div key={channel.id}>
              <div
                style={{
                  padding: '6px 8px',
                  margin: '1px 0',
                  borderRadius: 4,
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#5865f2' : 'transparent',
                  color: isActive ? '#ffffff' : '#96989d',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }}
                onClick={() => handleJoinChannel(channel)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#35393f';
                    e.currentTarget.style.color = '#dcddde';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#96989d';
                  }
                }}
              >
                <SoundOutlined style={{ 
                  marginRight: 6, 
                  fontSize: 20,
                  color: isActive ? '#ffffff' : '#8e9297'
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {channel.name}
                  </div>
                  {channel.description && (
                    <div style={{ 
                      fontSize: 12, 
                      opacity: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 2
                    }}>
                      {channel.description}
                    </div>
                  )}
                </div>
                
                {/* 在线用户数量指示器 */}
                {channelUsers.length > 0 && (
                  <div style={{
                    color: isActive ? '#ffffff' : '#8e9297',
                    fontSize: 12,
                    fontWeight: 500,
                    marginLeft: 4
                  }}>
                    {channelUsers.length}
                  </div>
                )}
              </div>
              
              {/* 频道内的在线用户列表 */}
              {channelUsers.length > 0 && (
                <div style={{
                  paddingLeft: 32,
                  marginBottom: 4
                }}>
                  {channelUsers.map((connectedUser) => (
                    <div
                      key={connectedUser.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: '#b9bbbe',
                        fontSize: 14,
                        lineHeight: 1.2,
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#35393f';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Avatar 
                        size={20} 
                        style={{ 
                          backgroundColor: '#5865f2',
                          marginRight: 8,
                          fontSize: 10
                        }}
                      >
                        {connectedUser.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <span>{connectedUser.username}</span>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#3ba55d',
                        marginLeft: 'auto'
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

            {channels.length === 0 && (
              <div style={{
                padding: '16px 8px',
                textAlign: 'center',
                color: '#72767d',
                fontSize: 14
              }}>
                暂无频道
              </div>
            )}
          </>
        )}
      </div>

      {/* 语音控制面板 */}
      {isInVoiceChannel && currentVoiceChannelName && (
        <div style={{
          backgroundColor: '#292b2f',
          padding: '8px',
          borderTop: '1px solid #202225',
          borderBottom: '1px solid #202225'
        }}>
          {/* 当前语音频道信息 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 8,
            padding: '4px 8px',
            backgroundColor: '#36393f',
            borderRadius: 4
          }}>
            <SoundFilled style={{
              color: '#3ba55d',
              fontSize: 14,
              marginRight: 8
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{
                color: '#3ba55d',
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                语音已连接
              </Text>
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 500,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentVoiceChannelName}
              </Text>
            </div>
          </div>

          {/* 语音控制按钮 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 4
          }}>
            {/* 静音按钮 */}
            <Button
              type="text"
              icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={onToggleMute}
              style={{
                flex: 1,
                height: 32,
                backgroundColor: isMuted ? '#ed4245' : '#4f545c',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
              onMouseEnter={(e) => {
                if (!isMuted) {
                  e.currentTarget.style.backgroundColor = '#5d6269';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isMuted ? '#ed4245' : '#4f545c';
              }}
            />

            {/* 禁听按钮 */}
            <Button
              type="text"
              icon={isDeafened ? <StopOutlined /> : <SoundOutlined />}
              onClick={onToggleDeafen}
              style={{
                flex: 1,
                height: 32,
                backgroundColor: isDeafened ? '#ed4245' : '#4f545c',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
              onMouseEnter={(e) => {
                if (!isDeafened) {
                  e.currentTarget.style.backgroundColor = '#5d6269';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDeafened ? '#ed4245' : '#4f545c';
              }}
            />

            {/* 退出语音频道按钮 */}
            <Button
              type="text"
              icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
              onClick={onLeaveVoice}
              style={{
                flex: 1,
                height: 32,
                backgroundColor: '#ed4245',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c73e41';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ed4245';
              }}
            />
          </div>
        </div>
      )}

      {/* 用户信息区域 */}
      {user && (
        <div style={{
          height: 52,
          backgroundColor: '#292b2f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          borderTop: '1px solid #202225'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            flex: 1,
            minWidth: 0
          }}>
            <Avatar size={32} style={{ 
              backgroundColor: '#5865f2',
              marginRight: 8
            }}>
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              minWidth: 0,
              flex: 1
            }}>
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.username}
              </Text>
              <Text style={{ 
                color: '#b9bbbe', 
                fontSize: 12,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                #{user.id}
              </Text>
            </div>
          </div>
          
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: '个人资料',
                  onClick: () => setIsProfileVisible(true),
                },
                {
                  key: 'settings',
                  icon: <SettingOutlined />,
                  label: '设置',
                },
                {
                  type: 'divider' as const,
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: onLogout,
                },
              ]
            }}
            placement="topRight"
            overlayClassName="discord-dropdown"
          >
            <Button 
              type="text" 
              icon={<SettingOutlined />}
              style={{
                color: '#b9bbbe',
                border: 'none',
                padding: '6px',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Dropdown>
        </div>
      )}

      {/* Discord风格的创建频道模态框 */}
      <DiscordModal
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        title="创建语音频道"
        subtitle="语音频道是大家聚在一起闲聊的地方。这些频道只能通过邀请才能访问，而且是私人对话。"
        width={440}
        footer={
          <>
            <DiscordButton
              variant="secondary"
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
            >
              取消
            </DiscordButton>
            <DiscordButton
              variant="primary"
              onClick={() => form.submit()}
              loading={loading}
            >
              创建频道
            </DiscordButton>
          </>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateChannel}>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入频道名称!' }]}
          >
            <DiscordInput
              label="频道名称"
              placeholder="新频道"
              required
            />
          </Form.Item>
          <Form.Item name="description">
            <DiscordTextArea
              label="频道描述（可选）"
              placeholder="描述这个频道的用途"
              rows={3}
            />
          </Form.Item>
        </Form>
      </DiscordModal>

      {/* 个人资料模态框 */}
      {user && (
        <UserProfile
          visible={isProfileVisible}
          onClose={() => setIsProfileVisible(false)}
          user={user}
          onUpdateProfile={(userData) => {
            // 这里可以添加更新用户信息的逻辑
            console.log('更新用户信息:', userData);
          }}
        />
      )}
    </div>
  );
};

export default ChannelList;