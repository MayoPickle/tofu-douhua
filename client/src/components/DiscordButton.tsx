import React from 'react';
import { Button } from 'antd';
import { ButtonProps } from 'antd/es/button';

interface DiscordButtonProps extends Omit<ButtonProps, 'type'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  fullWidth?: boolean;
}

const DiscordButton: React.FC<DiscordButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const getVariantStyles = (variant: string) => {
    const baseStyles = {
      border: 'none',
      borderRadius: 4,
      fontWeight: 500,
      height: 38,
      padding: '0 16px',
      transition: 'all 0.2s ease',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      outline: 'none',
      ...(fullWidth && { width: '100%' })
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#5865f2',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: '#4f545c',
          color: '#ffffff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#3ba55c',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: '#ed4245',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        };
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#00aff4',
          boxShadow: 'none',
          textDecoration: 'none',
        };
      default:
        return baseStyles;
    }
  };

  const getHoverStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#4752c4',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        };
      case 'secondary':
        return {
          backgroundColor: '#5d6269',
          transform: 'translateY(-1px)',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
        };
      case 'success':
        return {
          backgroundColor: '#2d7d32',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        };
      case 'danger':
        return {
          backgroundColor: '#c62828',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        };
      case 'link':
        return {
          color: '#0099cc',
          textDecoration: 'underline',
        };
      default:
        return {};
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const hoverStyles = getHoverStyles(variant);
    Object.assign(e.currentTarget.style, hoverStyles);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const originalStyles = getVariantStyles(variant);
    Object.assign(e.currentTarget.style, originalStyles);
    onMouseLeave?.(e);
  };

  return (
    <Button
      {...props}
      style={{
        ...getVariantStyles(variant),
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Button>
  );
};

export default DiscordButton;
