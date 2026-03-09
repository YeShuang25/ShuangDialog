import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const baseStyles = {
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? '#ccc' : '#007acc',
      color: 'white'
    },
    secondary: {
      backgroundColor: disabled ? '#f0f0f0' : '#f5f5f5',
      color: disabled ? '#999' : '#333',
      border: '1px solid #ddd'
    },
    danger: {
      backgroundColor: disabled ? '#ccc' : '#ff4444',
      color: 'white'
    }
  };

  const sizeStyles = {
    small: {
      padding: '4px 8px',
      fontSize: '12px'
    },
    medium: {
      padding: '8px 16px',
      fontSize: '14px'
    },
    large: {
      padding: '12px 24px',
      fontSize: '16px'
    }
  };

  const styles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size]
  };

  return (
    <button
      style={styles}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};