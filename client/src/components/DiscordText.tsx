import React from 'react';

interface DiscordTextProps {
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'danger' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

const DiscordText: React.FC<DiscordTextProps> = ({
  variant = 'primary',
  size = 'md',
  weight = 'normal',
  children,
  style,
  className,
  onClick,
}) => {
  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return '#b9bbbe';
      case 'muted':
        return '#72767d';
      case 'success':
        return '#3ba55c';
      case 'warning':
        return '#faa61a';
      case 'danger':
        return '#ed4245';
      case 'link':
        return '#00aff4';
      default:
        return '#ffffff';
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'xs':
        return { fontSize: 10, lineHeight: '12px' };
      case 'sm':
        return { fontSize: 12, lineHeight: '16px' };
      case 'md':
        return { fontSize: 14, lineHeight: '20px' };
      case 'lg':
        return { fontSize: 16, lineHeight: '24px' };
      case 'xl':
        return { fontSize: 20, lineHeight: '28px' };
      default:
        return { fontSize: 14, lineHeight: '20px' };
    }
  };

  const getWeightValue = (weight: string) => {
    switch (weight) {
      case 'normal':
        return 400;
      case 'medium':
        return 500;
      case 'semibold':
        return 600;
      case 'bold':
        return 700;
      default:
        return 400;
    }
  };

  const textStyles: React.CSSProperties = {
    color: getVariantColor(variant),
    fontWeight: getWeightValue(weight),
    margin: 0,
    padding: 0,
    ...getSizeStyles(size),
    ...(onClick && {
      cursor: 'pointer',
      transition: 'color 0.2s ease',
    }),
    ...(variant === 'link' && {
      textDecoration: 'none',
      cursor: 'pointer',
    }),
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (variant === 'link') {
      e.currentTarget.style.textDecoration = 'underline';
      e.currentTarget.style.color = '#0099cc';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (variant === 'link') {
      e.currentTarget.style.textDecoration = 'none';
      e.currentTarget.style.color = '#00aff4';
    }
  };

  return (
    <span
      style={textStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={variant === 'link' ? handleMouseEnter : undefined}
      onMouseLeave={variant === 'link' ? handleMouseLeave : undefined}
    >
      {children}
    </span>
  );
};

// 预定义的文字组件
export const DiscordTitle: React.FC<Omit<DiscordTextProps, 'size' | 'weight'>> = (props) => (
  <DiscordText {...props} size="xl" weight="semibold" />
);

export const DiscordSubtitle: React.FC<Omit<DiscordTextProps, 'size' | 'weight'>> = (props) => (
  <DiscordText {...props} size="lg" weight="medium" />
);

export const DiscordLabel: React.FC<Omit<DiscordTextProps, 'size' | 'weight' | 'variant'>> = (props) => (
  <DiscordText {...props} size="sm" weight="semibold" variant="secondary" style={{ 
    textTransform: 'uppercase', 
    letterSpacing: '0.02em',
    ...props.style 
  }} />
);

export const DiscordCaption: React.FC<Omit<DiscordTextProps, 'size' | 'variant'>> = (props) => (
  <DiscordText {...props} size="sm" variant="muted" />
);

export default DiscordText;
