import React from 'react';
import { Input, Form } from 'antd';
import { InputProps, TextAreaProps } from 'antd/es/input';

interface DiscordInputProps extends InputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

interface DiscordTextAreaProps extends TextAreaProps {
  label?: string;
  error?: string;
  required?: boolean;
}

const DiscordInput: React.FC<DiscordInputProps> = ({
  label,
  error,
  required,
  style,
  ...props
}) => {
  const inputStyles = {
    backgroundColor: '#2f3136',
    border: '1px solid #202225',
    borderRadius: 4,
    color: '#dcddde',
    fontSize: 14,
    padding: '10px 12px',
    height: 40,
    transition: 'border-color 0.2s ease',
    ...style,
  };

  const focusStyles = {
    borderColor: '#5865f2',
    boxShadow: '0 0 0 1px #5865f2',
    outline: 'none',
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block',
          color: '#b9bbbe',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          marginBottom: 8,
        }}>
          {label}
          {required && <span style={{ color: '#ed4245', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <Input
        {...props}
        style={inputStyles}
        onFocus={(e) => {
          Object.assign(e.target.style, focusStyles);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ed4245' : '#202225';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && (
        <div style={{
          color: '#ed4245',
          fontSize: 12,
          marginTop: 4,
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

const DiscordTextArea: React.FC<DiscordTextAreaProps> = ({
  label,
  error,
  required,
  style,
  ...props
}) => {
  const textAreaStyles = {
    backgroundColor: '#2f3136',
    border: '1px solid #202225',
    borderRadius: 4,
    color: '#dcddde',
    fontSize: 14,
    padding: '10px 12px',
    transition: 'border-color 0.2s ease',
    resize: 'vertical' as const,
    minHeight: 80,
    ...style,
  };

  const focusStyles = {
    borderColor: '#5865f2',
    boxShadow: '0 0 0 1px #5865f2',
    outline: 'none',
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block',
          color: '#b9bbbe',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          marginBottom: 8,
        }}>
          {label}
          {required && <span style={{ color: '#ed4245', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <Input.TextArea
        {...props}
        style={textAreaStyles}
        onFocus={(e) => {
          Object.assign(e.target.style, focusStyles);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ed4245' : '#202225';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && (
        <div style={{
          color: '#ed4245',
          fontSize: 12,
          marginTop: 4,
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export { DiscordInput, DiscordTextArea };
