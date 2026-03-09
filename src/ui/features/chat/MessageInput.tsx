import React, { useState } from 'react';

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = '输入消息...',
  className = ''
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}
      className={className}
    >
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical' as const,
          minHeight: '40px',
          maxHeight: '120px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          color: disabled ? '#999' : '#333'
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        style={{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: disabled || !message.trim() ? '#ccc' : '#007acc',
          color: 'white',
          cursor: disabled || !message.trim() ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        发送
      </button>
    </div>
  );
};