import React, { useState } from 'react';
import { Modal, Avatar, Button, Input, Form, message, Typography, Divider, Upload } from 'antd';
import { EditOutlined, CameraOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { User } from '../types';
import { userAPI } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserProfileProps {
  visible: boolean;
  onClose: () => void;
  user: User;
  onUpdateProfile?: (userData: Partial<User>) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ visible, onClose, user, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      bio: user.bio || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const updatedUser = await userAPI.updateProfile(values);

      if (onUpdateProfile) {
        onUpdateProfile(updatedUser);
      }

      message.success('个人资料更新成功！');
      setIsEditing(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (info: any) => {
    if (info.file.status === 'uploading') {
      return;
    }

    if (info.file.status === 'done') {
      try {
        const result = await userAPI.uploadAvatar(info.file.originFileObj);
        message.success('头像上传成功！');

        if (onUpdateProfile) {
          onUpdateProfile({ avatar: result.avatarUrl });
        }
      } catch (error) {
        message.error('头像上传失败');
      }
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="user-profile-modal"
      closable={false}
      styles={{
        content: {
          backgroundColor: '#36393f',
          borderRadius: 8,
          padding: 0,
          overflow: 'hidden'
        }
      }}
      destroyOnClose
    >
      {/* 头部背景 */}
      <div style={{
        height: 120,
        background: 'linear-gradient(135deg, #5865f2 0%, #3b82f6 100%)',
        position: 'relative'
      }}>
        {/* 关闭按钮 */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: '#ffffff',
            border: 'none',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        />
      </div>

        {/* 头像区域 */}
        <div style={{
          padding: '0 32px',
          paddingTop: 20,
          paddingBottom: 24,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          transform: 'translateY(-60px)'
        }}>
          <div style={{ position: 'relative' }}>
            <Avatar
              size={120}
              className="user-profile-avatar"
              style={{
                backgroundColor: '#5865f2',
                fontSize: 48,
                fontWeight: 600,
                border: '8px solid #36393f'
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>

            {isEditing && (
              <Upload
                name="avatar"
                showUploadList={false}
                onChange={handleAvatarUpload}
                accept="image/*"
              >
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  shape="circle"
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: '#5865f2',
                    borderColor: '#5865f2',
                    width: 32,
                    height: 32
                  }}
                />
              </Upload>
            )}
          </div>

          {/* 编辑按钮 */}
          {!isEditing && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
              style={{
                backgroundColor: '#5865f2',
                borderColor: '#5865f2',
                borderRadius: 4,
                height: 36,
                marginBottom: 8
              }}
            >
              编辑资料
            </Button>
          )}
        </div>

        {/* 用户信息区域 */}
        <div style={{
          padding: '0 32px 32px 32px',
          marginTop: -40
        }}>
            {!isEditing ? (
              // 查看模式
              <div>
                <div style={{ marginBottom: 24 }}>
                  <Title level={2} style={{ 
                    color: '#ffffff', 
                    margin: 0,
                    fontSize: 32,
                    fontWeight: 600
                  }}>
                    {user.username}
                  </Title>
                  <Text style={{ 
                    color: '#b9bbbe', 
                    fontSize: 16,
                    display: 'block',
                    marginTop: 4
                  }}>
                    #{user.id}
                  </Text>
                </div>

                <Divider style={{ 
                  backgroundColor: '#4f545c',
                  margin: '24px 0'
                }} />

                <div style={{ marginBottom: 24 }}>
                  <Text style={{ 
                    color: '#b9bbbe', 
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                    marginBottom: 8
                  }}>
                    邮箱
                  </Text>
                  <Text style={{ 
                    color: '#dcddde', 
                    fontSize: 16
                  }}>
                    {user.email}
                  </Text>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text style={{ 
                    color: '#b9bbbe', 
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                    marginBottom: 8
                  }}>
                    个人简介
                  </Text>
                  <Text style={{ 
                    color: '#dcddde', 
                    fontSize: 16,
                    lineHeight: 1.5
                  }}>
                    {user.bio || '这个人很懒，什么都没有留下...'}
                  </Text>
                </div>

                <div>
                  <Text style={{ 
                    color: '#b9bbbe', 
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                    marginBottom: 8
                  }}>
                    加入时间
                  </Text>
                  <Text style={{ 
                    color: '#dcddde', 
                    fontSize: 16
                  }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                  </Text>
                </div>
              </div>
            ) : (
              // 编辑模式
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  name="username"
                  label={
                    <Text style={{ 
                      color: '#b9bbbe', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      textTransform: 'uppercase' 
                    }}>
                      用户名
                    </Text>
                  }
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input
                    style={{
                      backgroundColor: '#202225',
                      border: 'none',
                      borderRadius: 4,
                      color: '#ffffff',
                      fontSize: 16,
                      padding: '12px'
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={
                    <Text style={{ 
                      color: '#b9bbbe', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      textTransform: 'uppercase' 
                    }}>
                      邮箱
                    </Text>
                  }
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    style={{
                      backgroundColor: '#202225',
                      border: 'none',
                      borderRadius: 4,
                      color: '#ffffff',
                      fontSize: 16,
                      padding: '12px'
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="bio"
                  label={
                    <Text style={{ 
                      color: '#b9bbbe', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      textTransform: 'uppercase' 
                    }}>
                      个人简介
                    </Text>
                  }
                >
                  <TextArea
                    rows={4}
                    maxLength={190}
                    showCount
                    style={{
                      backgroundColor: '#202225',
                      border: 'none',
                      borderRadius: 4,
                      color: '#ffffff',
                      fontSize: 16,
                      padding: '12px'
                    }}
                    placeholder="介绍一下自己吧..."
                  />
                </Form.Item>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 12,
                  marginTop: 24 
                }}>
                  <Button
                    onClick={handleCancel}
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
                    icon={<SaveOutlined />}
                    style={{
                      backgroundColor: '#5865f2',
                      borderColor: '#5865f2',
                      fontSize: 14,
                      fontWeight: 500,
                      padding: '8px 16px',
                      height: 'auto',
                      borderRadius: 4
                    }}
                  >
                    保存更改
                  </Button>
                </div>
              </Form>
            )}
          </div>
    </Modal>
  );
};

export default UserProfile;
