import React, { useState, useEffect } from 'react';
import { Input, message } from 'antd';
import { CopyOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { Server } from '../types';
import { serverAPI } from '../services/api';
import DiscordModal from './DiscordModal';
import DiscordButton from './DiscordButton';
import DiscordText, { DiscordLabel } from './DiscordText';

interface InviteModalProps {
  visible: boolean;
  onCancel: () => void;
  server: Server | null;
}

const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onCancel,
  server
}) => {
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const inviteUrl = inviteCode ? `${window.location.origin}?invite=${inviteCode}` : '';

  const fetchInviteCode = () => {
    if (server) {
      setInviteCode(server.invite_code);
    }
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      message.success({
        content: '邀请链接已复制！',
        style: {
          marginTop: '20vh',
        },
      });
    } catch (error) {
      // 如果剪贴板API不可用，使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success({
        content: '邀请链接已复制！',
        style: {
          marginTop: '20vh',
        },
      });
    }
  };

  const handleRegenerateInvite = async () => {
    if (!server) return;

    setRegenerating(true);
    try {
      const response = await serverAPI.generateInvite(server.id);
      setInviteCode(response.invite_code);
      message.success({
        content: '新的邀请链接已生成！',
        style: {
          marginTop: '20vh',
        },
      });
    } catch (error: any) {
      message.error({
        content: error.response?.data?.error || '生成邀请链接失败',
        style: {
          marginTop: '20vh',
        },
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `加入 ${server?.name} 服务器`,
          text: `邀请你加入 ${server?.name} 服务器！`,
          url: inviteUrl,
        });
      } catch (error) {
        // 用户取消分享或分享失败，不显示错误
      }
    } else {
      // 如果不支持Web Share API，复制到剪贴板
      handleCopyInvite();
    }
  };

  useEffect(() => {
    if (visible && server) {
      fetchInviteCode();
    }
  }, [visible, server]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        onCancel();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && visible) {
        event.preventDefault();
        handleCopyInvite();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible, onCancel, handleCopyInvite]);

  if (!server) return null;

  return (
    <DiscordModal
      visible={visible}
      onCancel={onCancel}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            backgroundColor: '#5865f2',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <DiscordText size="lg" weight="semibold">
              {server.name.charAt(0).toUpperCase()}
            </DiscordText>
          </div>
          邀请朋友到 {server.name}
        </div>
      }
      width={440}
    >

      <div style={{ marginBottom: 20 }}>
        <DiscordText variant="secondary">
          分享这个邀请链接给朋友，让他们加入你的服务器！
        </DiscordText>
      </div>

      <div style={{ marginBottom: 20 }}>
        <DiscordLabel style={{ marginBottom: 8, display: 'block' }}>
          邀请链接
        </DiscordLabel>
        <div style={{
          display: 'flex',
          backgroundColor: '#2f3136',
          borderRadius: 4,
          border: '1px solid #202225',
          overflow: 'hidden'
        }}>
          <Input
            value={inviteUrl}
            readOnly
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: '#dcddde',
              fontSize: 14,
              fontFamily: 'monospace',
              flex: 1,
              padding: '10px 12px'
            }}
          />
          <DiscordButton
            variant="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyInvite}
            style={{
              borderRadius: 0,
              height: '100%',
              padding: '0 12px',
              minWidth: 'auto'
            }}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div style={{
        backgroundColor: '#2f3136',
        borderRadius: 4,
        padding: 16,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ color: '#b9bbbe', marginRight: 8 }} />
            <DiscordText weight="semibold">
              高级设置
            </DiscordText>
          </div>
          <DiscordButton
            variant="link"
            icon={<ReloadOutlined />}
            onClick={handleRegenerateInvite}
            loading={regenerating}
            style={{ fontSize: 12 }}
          >
            重新生成
          </DiscordButton>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <DiscordText variant="secondary">
              邀请码
            </DiscordText>
            <br />
            <DiscordText variant="muted" size="sm">
              用户可以直接输入这个代码加入服务器
            </DiscordText>
          </div>
          <DiscordText
            style={{
              backgroundColor: '#202225',
              padding: '6px 10px',
              borderRadius: 4,
              fontFamily: 'monospace',
              border: '1px solid #40444b'
            }}
            weight="semibold"
          >
            {inviteCode}
          </DiscordText>
        </div>
      </div>

      {/* Footer Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <DiscordButton
          variant="primary"
          onClick={handleCopyInvite}
        >
          复制邀请链接
        </DiscordButton>
      </div>
    </DiscordModal>
  );
};

export default InviteModal;
