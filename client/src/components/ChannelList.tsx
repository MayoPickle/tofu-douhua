import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, message, Typography } from 'antd';
import { PlusOutlined, SoundOutlined, HashOutlined } from '@ant-design/icons';
import { Channel } from '../types';
import { channelAPI } from '../services/api';

const { Title, Text } = Typography;

interface ChannelListProps {
  onChannelSelect: (channel: Channel) => void;
  selectedChannelId: number | null;
}

const ChannelList: React.FC<ChannelListProps> = ({ onChannelSelect, selectedChannelId }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchChannels = async () => {
    try {
      const channelList = await channelAPI.getChannels();
      setChannels(channelList);
    } catch (error) {
      message.error('获取频道列表失败');
    }
  };

  const handleCreateChannel = async (values: { name: string; description?: string }) => {
    setLoading(true);
    try {
      const newChannel = await channelAPI.createChannel(values.name, values.description);
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
    } catch (error: any) {
      if (error.response?.status === 400) {
        onChannelSelect(channel);
      } else {
        message.error('加入频道失败');
      }
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

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
        <Text strong style={{ 
          color: '#ffffff', 
          fontSize: 16,
          display: 'block',
          marginBottom: 8
        }}>
          豆腐花服务器
        </Text>
      </div>

      {/* 频道列表 */}
      <div style={{ 
        flex: 1, 
        padding: '16px 8px',
        overflowY: 'auto'
      }}>
        {/* 语音频道分类 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          marginBottom: 8
        }}>
          <Text style={{ 
            color: '#8e9297', 
            fontSize: 12, 
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            语音频道
          </Text>
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
        {channels.map((channel) => (
          <div
            key={channel.id}
            style={{
              padding: '6px 8px',
              margin: '1px 0',
              borderRadius: 4,
              cursor: 'pointer',
              backgroundColor: selectedChannelId === channel.id ? '#5865f2' : 'transparent',
              color: selectedChannelId === channel.id ? '#ffffff' : '#96989d',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
            onClick={() => handleJoinChannel(channel)}
            onMouseEnter={(e) => {
              if (selectedChannelId !== channel.id) {
                e.currentTarget.style.backgroundColor = '#35393f';
                e.currentTarget.style.color = '#dcddde';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedChannelId !== channel.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#96989d';
              }
            }}
          >
            <SoundOutlined style={{ 
              marginRight: 6, 
              fontSize: 20,
              color: selectedChannelId === channel.id ? '#ffffff' : '#8e9297'
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
          </div>
        ))}

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
      </div>

      {/* Discord风格的创建频道模态框 */}
      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={440}
        styles={{
          content: {
            backgroundColor: '#36393f',
            borderRadius: 8,
            padding: 0
          }
        }}
      >
        <div style={{ padding: 24 }}>
          <Title level={4} style={{ 
            color: '#ffffff', 
            marginBottom: 8,
            fontSize: 20,
            fontWeight: 600
          }}>
            创建语音频道
          </Title>
          <Text style={{ 
            color: '#b9bbbe', 
            fontSize: 14,
            display: 'block',
            marginBottom: 20
          }}>
            语音频道是大家聚在一起闲聊的地方。这些频道只能通过邀请才能访问，而且是私人对话。
          </Text>

          <Form form={form} layout="vertical" onFinish={handleCreateChannel}>
            <Form.Item
              name="name"
              label={<Text style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>频道名称</Text>}
              rules={[{ required: true, message: '请输入频道名称!' }]}
            >
              <Input 
                placeholder="新频道"
                style={{
                  backgroundColor: '#202225',
                  border: 'none',
                  borderRadius: 3,
                  color: '#ffffff',
                  fontSize: 16,
                  padding: '10px 12px'
                }}
              />
            </Form.Item>
            <Form.Item 
              name="description" 
              label={<Text style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>频道描述（可选）</Text>}
            >
              <Input.TextArea 
                placeholder="描述这个频道的用途"
                rows={3}
                style={{
                  backgroundColor: '#202225',
                  border: 'none',
                  borderRadius: 3,
                  color: '#ffffff',
                  fontSize: 16,
                  padding: '10px 12px'
                }}
              />
            </Form.Item>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 12,
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #3f4147'
            }}>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '8px 16px',
                  height: 'auto'
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{
                  backgroundColor: '#5865f2',
                  borderColor: '#5865f2',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '8px 16px',
                  height: 'auto',
                  borderRadius: 3
                }}
              >
                创建频道
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default ChannelList;