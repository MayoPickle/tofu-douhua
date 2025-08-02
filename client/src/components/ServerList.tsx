import React, { useState, useEffect } from 'react';
import { Button, Form, message, Tooltip } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { Server, User } from '../types';
import { serverAPI } from '../services/api';
import DiscordModal from './DiscordModal';
import DiscordButton from './DiscordButton';
import DiscordText from './DiscordText';
import { DiscordInput, DiscordTextArea } from './DiscordInput';

interface ServerListProps {
  user: User;
  selectedServerId: number | null;
  onServerSelect: (server: Server) => void;
}

const ServerList: React.FC<ServerListProps> = ({
  user,
  selectedServerId,
  onServerSelect
}) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [joinForm] = Form.useForm();

  const fetchServers = async () => {
    try {
      const serverList = await serverAPI.getServers();
      setServers(serverList);
      
      // 如果没有选中的服务器，自动选择第一个（通常是豆腐花服务器）
      if (!selectedServerId && serverList.length > 0) {
        onServerSelect(serverList[0]);
      }
    } catch (error) {
      message.error('获取服务器列表失败');
    }
  };

  const handleCreateServer = async (values: { name: string; description?: string }) => {
    setLoading(true);
    try {
      const newServer = await serverAPI.createServer(values);
      setServers(prev => [...prev, newServer]);
      setIsCreateModalVisible(false);
      createForm.resetFields();
      onServerSelect(newServer);
      message.success('服务器创建成功！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建服务器失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinServer = async (values: { inviteCode: string }) => {
    setLoading(true);
    try {
      const response = await serverAPI.joinServer(values.inviteCode);
      await fetchServers(); // 重新获取服务器列表
      setIsJoinModalVisible(false);
      joinForm.resetFields();
      message.success(`成功加入服务器: ${response.server.name}`);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加入服务器失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  return (
    <div style={{
      width: 72,
      backgroundColor: '#202225',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 0',
      height: '100vh',
      overflowY: 'auto'
    }}>
      {/* 服务器列表 */}
      {servers.map((server) => {
        const isSelected = selectedServerId === server.id;
        const serverInitial = server.name.charAt(0).toUpperCase();
        
        return (
          <Tooltip key={server.id} title={server.name} placement="right">
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: isSelected ? '#5865f2' : '#36393f',
                borderRadius: isSelected ? 12 : 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                border: isSelected ? '2px solid #ffffff' : 'none'
              }}
              onClick={() => onServerSelect(server)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderRadius = '12px';
                  e.currentTarget.style.backgroundColor = '#5865f2';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderRadius = '24px';
                  e.currentTarget.style.backgroundColor = '#36393f';
                }
              }}
            >
              <DiscordText size="lg" weight="semibold">
                {serverInitial}
              </DiscordText>
              
              {/* 选中指示器 */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  left: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: 20,
                  backgroundColor: '#ffffff',
                  borderRadius: '0 2px 2px 0'
                }} />
              )}
            </div>
          </Tooltip>
        );
      })}
      
      {/* 分隔线 */}
      <div style={{
        width: 32,
        height: 2,
        backgroundColor: '#36393f',
        borderRadius: 1,
        margin: '8px 0'
      }} />
      
      {/* 创建服务器按钮 */}
      <Tooltip title="创建服务器" placement="right">
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#36393f',
            color: '#3ba55c',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            fontSize: 18,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderRadius = '12px';
            e.currentTarget.style.backgroundColor = '#3ba55c';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderRadius = '24px';
            e.currentTarget.style.backgroundColor = '#36393f';
            e.currentTarget.style.color = '#3ba55c';
          }}
        />
      </Tooltip>
      
      {/* 加入服务器按钮 */}
      <Tooltip title="加入服务器" placement="right">
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => setIsJoinModalVisible(true)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#36393f',
            color: '#3ba55c',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderRadius = '12px';
            e.currentTarget.style.backgroundColor = '#3ba55c';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderRadius = '24px';
            e.currentTarget.style.backgroundColor = '#36393f';
            e.currentTarget.style.color = '#3ba55c';
          }}
        />
      </Tooltip>

      {/* 创建服务器模态框 */}
      <DiscordModal
        visible={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        title="创建服务器"
        subtitle="为你的社区创建一个新的服务器"
        width={440}
        footer={
          <>
            <DiscordButton
              variant="secondary"
              onClick={() => {
                setIsCreateModalVisible(false);
                createForm.resetFields();
              }}
            >
              取消
            </DiscordButton>
            <DiscordButton
              variant="primary"
              onClick={() => createForm.submit()}
              loading={loading}
            >
              创建服务器
            </DiscordButton>
          </>
        }
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateServer}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入服务器名称' }]}
          >
            <DiscordInput
              label="服务器名称"
              placeholder="输入服务器名称"
              maxLength={50}
              required
            />
          </Form.Item>

          <Form.Item name="description">
            <DiscordTextArea
              label="服务器描述"
              placeholder="输入服务器描述（可选）"
              rows={3}
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </DiscordModal>

      {/* 加入服务器模态框 */}
      <DiscordModal
        visible={isJoinModalVisible}
        onCancel={() => {
          setIsJoinModalVisible(false);
          joinForm.resetFields();
        }}
        title="加入服务器"
        subtitle="输入邀请码来加入现有的服务器"
        width={440}
        footer={
          <>
            <DiscordButton
              variant="secondary"
              onClick={() => {
                setIsJoinModalVisible(false);
                joinForm.resetFields();
              }}
            >
              取消
            </DiscordButton>
            <DiscordButton
              variant="success"
              onClick={() => joinForm.submit()}
              loading={loading}
            >
              加入服务器
            </DiscordButton>
          </>
        }
      >
        <DiscordText variant="secondary" style={{ marginBottom: 16 }}>
          输入朋友发送给你的邀请码，或者粘贴邀请链接。
        </DiscordText>

        <Form
          form={joinForm}
          layout="vertical"
          onFinish={handleJoinServer}
        >
          <Form.Item
            name="inviteCode"
            rules={[{ required: true, message: '请输入邀请码' }]}
          >
            <DiscordInput
              label="邀请码"
              placeholder="输入邀请码或粘贴邀请链接"
              required
            />
          </Form.Item>
        </Form>
      </DiscordModal>
    </div>
  );
};

export default ServerList;
