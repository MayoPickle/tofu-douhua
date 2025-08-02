import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { Channel, Message, User } from '../types';
import { channelAPI } from '../services/api';
import socketService from '../services/socket';


const { Title, Text } = Typography;

interface ChatAreaProps {
  channel: Channel | null;
  user: User;
}

const ChatArea: React.FC<ChatAreaProps> = ({ channel, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!channel) return;
    
    try {
      const channelMessages = await channelAPI.getMessages(channel.id);
      setMessages(channelMessages);
    } catch (error) {
      console.error('获取消息失败:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !channel) return;
    
    socketService.sendMessage(channel.id, inputValue.trim());
    setInputValue('');
  };



  useEffect(() => {
    if (channel) {
      fetchMessages();
      socketService.joinChannel(channel.id);
      
      const handleNewMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
      };

      socketService.onNewMessage(handleNewMessage);

      return () => {
        socketService.leaveChannel(channel.id);
      };
    }
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  if (!channel) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        backgroundColor: '#36393f',
        color: '#dcddde'
      }}>
        <Title level={3} style={{ color: '#8e9297', margin: 0 }}>选择一个频道开始聊天</Title>
        <Text style={{ color: '#72767d', marginTop: 8 }}>在左侧选择或创建一个语音频道</Text>
      </div>
    );
  }

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#36393f' 
    }}>
      {/* 频道头部 */}
      <div style={{ 
        height: 48,
        padding: '0 16px', 
        borderBottom: '1px solid #202225',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#36393f',
        boxShadow: '0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05), 0 2px 0 rgba(4,4,5,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text strong style={{ color: '#ffffff', fontSize: 16, margin: 0 }}>
            # {channel.name}
          </Text>
          {channel.description && (
            <>
              <div style={{ 
                width: 1, 
                height: 24, 
                backgroundColor: '#4f545c', 
                margin: '0 8px' 
              }} />
              <Text style={{ color: '#8e9297', fontSize: 14 }}>{channel.description}</Text>
            </>
          )}
        </div>
      </div>


      {/* 消息列表 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        backgroundColor: '#36393f',
        padding: '0'
      }}>
        {messages.map((message, index) => {
          const showAvatar = index === 0 || messages[index - 1]?.username !== message.username;
          return (
            <div
              key={`${message.id}-${index}`}
              style={{
                padding: showAvatar ? '0.125rem 1rem 0' : '0 1rem',
                marginTop: showAvatar ? '1.0625rem' : '0',
                position: 'relative',
                wordWrap: 'break-word',
                userSelect: 'text',
                minHeight: showAvatar ? 44 : 22
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#32353b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                {showAvatar ? (
                  <Avatar 
                    size={40}
                    style={{ 
                      backgroundColor: '#5865f2',
                      marginRight: 16,
                      marginTop: 2,
                      flexShrink: 0
                    }}
                  >
                    {message.username.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <div style={{ width: 56, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {showAvatar && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      marginBottom: 2 
                    }}>
                      <Text strong style={{ 
                        color: '#ffffff', 
                        fontSize: 16, 
                        fontWeight: 500,
                        marginRight: 8
                      }}>
                        {message.username}
                      </Text>
                      <Text style={{ 
                        fontSize: 12, 
                        color: '#a3a6aa',
                        fontWeight: 500
                      }}>
                        {new Date(message.created_at).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </div>
                  )}
                  <div style={{ 
                    color: '#dcddde', 
                    fontSize: 16,
                    lineHeight: 1.375,
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} style={{ height: 16 }} />
      </div>

      {/* 消息输入 */}
      <div style={{ 
        padding: 16,
        backgroundColor: '#36393f'
      }}>
        <div style={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#40444b',
          borderRadius: 8,
          padding: '1px',
          border: '1px solid transparent',
          transition: 'border-color 0.2s ease'
        }}>
          <Input
            placeholder={`给 #${channel.name} 发送消息`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendMessage}
            onFocus={(e) => {
              e.target.parentElement.style.borderColor = '#5865f2';
            }}
            onBlur={(e) => {
              e.target.parentElement.style.borderColor = 'transparent';
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#dcddde',
              fontSize: 16,
              padding: '11px 16px',
              flex: 1,
              outline: 'none',
              boxShadow: 'none'
            }}
            className="discord-input"
            suffix={
              inputValue.trim() ? (
                <SendOutlined
                  onClick={handleSendMessage}
                  style={{
                    color: '#5865f2',
                    fontSize: 18,
                    cursor: 'pointer',
                    padding: 4,
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#4752c4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#5865f2';
                  }}
                />
              ) : null
            }
          />
        </div>
        
        <style>{`
          .discord-input::placeholder {
            color: #8e9297 !important;
            opacity: 1 !important;
          }
          .discord-input:focus::placeholder {
            color: #6d6f78 !important;
          }
          .discord-input::-webkit-input-placeholder {
            color: #8e9297 !important;
          }
          .discord-input::-moz-placeholder {
            color: #8e9297 !important;
            opacity: 1 !important;
          }
          .discord-input:-ms-input-placeholder {
            color: #8e9297 !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ChatArea;