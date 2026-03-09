// 聊天面板主组件
import React, { useState } from 'react';
import { FloatingWindow, Button } from '../components';
import { MessageList, Message, MessageInput } from '../features';

export const ChatPanel: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <>
      <FloatingWindow
        title="霜语"
        defaultPosition={{ x: 100, y: 100 }}
        defaultSize={{ width: 400, height: 500 }}
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px'
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 消息显示区域 */}
          <MessageList messages={messages} />

          {/* 输入框区域 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MessageInput onSendMessage={handleSendMessage} />
            <Button onClick={toggleSettings} variant="secondary" size="small">
              设置
            </Button>
          </div>
        </div>
      </FloatingWindow>

      {/* 设置弹窗 */}
      {showSettings && (
        <FloatingWindow
          title="设置"
          defaultPosition={{ x: 520, y: 100 }}
          defaultSize={{ width: 300, height: 200 }}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px'
          }}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={toggleDebugMode}
                />
                <span>调试模式</span>
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                这里可以添加更多设置选项...
              </p>
            </div>

            <button
              onClick={toggleSettings}
              style={{
                padding: '6px 12px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              关闭
            </button>
          </div>
        </FloatingWindow>
      )}
    </>
  );
};
