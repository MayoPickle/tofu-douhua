import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';
import { User } from '../types';

const { Title } = Typography;

interface AuthProps {
  onAuth: (user: User, token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuth }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values.email, values.password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onAuth(response.user, response.token);
      message.success('登录成功！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string; username: string }) => {
    setLoading(true);
    try {
      const response = await authAPI.register(values.email, values.password, values.username);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onAuth(response.user, response.token);
      message.success('注册成功！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form name="login" onFinish={handleLogin} layout="vertical">
      <Form.Item
        name="email"
        label={<span style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>邮箱 *</span>}
        rules={[
          { required: true, message: '请输入邮箱!' },
          { type: 'email', message: '请输入有效的邮箱地址!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined style={{ color: '#72767d' }} />} 
          placeholder="邮箱"
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
        name="password"
        label={<span style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>密码 *</span>}
        rules={[{ required: true, message: '请输入密码!' }]}
      >
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#72767d' }} />} 
          placeholder="密码"
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
      <Form.Item style={{ marginTop: 20 }}>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          style={{
            backgroundColor: '#5865f2',
            borderColor: '#5865f2',
            borderRadius: 3,
            height: 44,
            fontSize: 16,
            fontWeight: 500
          }}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form name="register" onFinish={handleRegister} layout="vertical">
      <Form.Item
        name="username"
        label={<span style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>用户名 *</span>}
        rules={[{ required: true, message: '请输入用户名!' }]}
      >
        <Input 
          prefix={<UserOutlined style={{ color: '#72767d' }} />} 
          placeholder="用户名"
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
        name="email"
        label={<span style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>邮箱 *</span>}
        rules={[
          { required: true, message: '请输入邮箱!' },
          { type: 'email', message: '请输入有效的邮箱地址!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined style={{ color: '#72767d' }} />} 
          placeholder="邮箱"
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
        name="password"
        label={<span style={{ color: '#b9bbbe', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>密码 *</span>}
        rules={[
          { required: true, message: '请输入密码!' },
          { min: 6, message: '密码至少6位!' }
        ]}
      >
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#72767d' }} />} 
          placeholder="密码"
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
      <Form.Item style={{ marginTop: 20 }}>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          style={{
            backgroundColor: '#5865f2',
            borderColor: '#5865f2',
            borderRadius: 3,
            height: 44,
            fontSize: 16,
            fontWeight: 500
          }}
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20
    }}>
      <div style={{
        width: 400,
        backgroundColor: '#36393f',
        borderRadius: 8,
        padding: 32,
        boxShadow: '0 8px 16px rgba(0,0,0,0.24)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ 
            color: '#ffffff', 
            marginBottom: 8,
            fontSize: 24,
            fontWeight: 600
          }}>
            欢迎来到豆腐花
          </Title>
          <Title level={4} style={{ 
            color: '#b9bbbe', 
            margin: 0,
            fontSize: 16,
            fontWeight: 400
          }}>
            很高兴你再次回来！
          </Title>
        </div>

        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: '登录',
              children: loginForm,
            },
            {
              key: 'register',
              label: '注册',
              children: registerForm,
            },
          ]}
          style={{
            color: '#ffffff'
          }}
          tabBarStyle={{
            borderBottom: '1px solid #4f545c',
            marginBottom: 24
          }}
        />
      </div>
    </div>
  );
};

export default Auth;