import React from 'react';

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  disabled?: boolean;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  className = ''
}) => {
  const styles = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: disabled ? '#f5f5f5' : 'white',
    color: disabled ? '#999' : '#333',
    cursor: disabled ? 'not-allowed' : 'text',
    width: '100%',
    boxSizing: 'border-box' as const
  };

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={styles}
      className={className}
    />
  );
};