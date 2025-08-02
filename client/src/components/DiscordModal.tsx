import React, { useEffect } from 'react';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import DiscordButton from './DiscordButton';

interface DiscordModalProps {
  visible: boolean;
  onCancel: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
}

const DiscordModal: React.FC<DiscordModalProps> = ({
  visible,
  onCancel,
  title,
  subtitle,
  width = 440,
  children,
  footer,
  showCloseButton = true,
}) => {
  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible, onCancel]);

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={width}
      centered
      closable={false}
      styles={{
        body: { padding: 0 },
        content: { 
          backgroundColor: '#36393f',
          borderRadius: 8,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #2f3136',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            color: '#ffffff', 
            fontSize: 20,
            fontWeight: 600,
            lineHeight: '24px'
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              margin: '4px 0 0 0',
              color: '#b9bbbe',
              fontSize: 14,
              lineHeight: '20px'
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {showCloseButton && (
          <DiscordButton
            variant="link"
            icon={<CloseOutlined />}
            onClick={onCancel}
            style={{
              color: '#b9bbbe',
              backgroundColor: 'transparent',
              padding: 8,
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = '#ed4245';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#b9bbbe';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #2f3136',
          backgroundColor: '#2f3136',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          {footer}
        </div>
      )}
    </Modal>
  );
};

export default DiscordModal;
