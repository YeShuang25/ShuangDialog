import React from 'react';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface MessageListProps {
  messages: Message[];
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  className = ''
}) => {
  return (
    <div
      style={{
        flex: 1,
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9',
        overflowY: 'auto',
        minHeight: '200px'
      }}
      className={className}
    >
      {messages.length === 0 ? (
        <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
          暂无消息
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '8px',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: message.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderLeft: `4px solid ${message.sender === 'user' ? '#2196f3' : '#757575'}`
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {message.sender === 'user' ? '你' : '助手'} • {message.timestamp.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {message.content}
            </div>
          </div>
        ))
      )}
    </div>
  );
};