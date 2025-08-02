import React, { useState, useEffect } from 'react';
import { List, Button, Modal, Form, Input, message, Typography } from 'antd';
import { PlusOutlined, SoundOutlined } from '@ant-design/icons';
import { Channel } from '../types';
import { channelAPI } from '../services/api';

const { Title } = Typography;

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
    <div style={{ width: 250, borderRight: '1px solid #f0f0f0', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>语音频道</Title>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          创建
        </Button>
      </div>

      <List
        dataSource={channels}
        renderItem={(channel) => (
          <List.Item
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: selectedChannelId === channel.id ? '#e6f7ff' : 'transparent',
              borderRadius: 4,
              marginBottom: 4
            }}
            onClick={() => handleJoinChannel(channel)}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SoundOutlined style={{ marginRight: 8 }} />
                <strong>{channel.name}</strong>
              </div>
              {channel.description && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {channel.description}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                创建者: {channel.creator_name}
              </div>
            </div>
          </List.Item>
        )}
      />

      <Modal
        title="创建新频道"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateChannel}>
          <Form.Item
            name="name"
            label="频道名称"
            rules={[{ required: true, message: '请输入频道名称!' }]}
          >
            <Input placeholder="输入频道名称" />
          </Form.Item>
          <Form.Item name="description" label="频道描述">
            <Input.TextArea placeholder="输入频道描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              创建频道
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChannelList;