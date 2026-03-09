// 聊天面板主组件
import React, { useState } from 'react';
import { FloatingWindow, Button } from '../components';
import { MessageList, Message, MessageInput } from '../features';
import { useDebugStore } from '../../store/useDebugStore';

// 颜色主题
const theme = {
  primary: '#007acc',
  primaryLight: '#e3f2fd',
  secondary: '#f5f5f5',
  accent: '#ff6b6b',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
  background: '#ffffff',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
};

// CSS动画样式
const styles = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .fade-in { animation: fadeIn 0.3s ease-out; }
`;

export const ChatPanel: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // 使用全局调试状态
  const { debugMode, toggleDebugMode } = useDebugStore();

  const toggleSettings = () => {
    setShowSettings(!showSettings);
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

  // 动态添加样式
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      <FloatingWindow
        title="霜语"
        defaultPosition={{ x: 100, y: 100 }}
        defaultSize={{ width: 400, height: 500 }}
        onSettings={toggleSettings}
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '14px',
          boxShadow: theme.shadow,
          border: 'none',
          borderRadius: '8px'
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 消息显示区域 */}
          <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
            <MessageList messages={messages} />
          </div>

          {/* 输入框区域 */}
          <div style={{ padding: '12px', borderTop: `1px solid ${theme.border}` }}>
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      </FloatingWindow>

      {/* 设置弹窗 */}
      {showSettings && (
        <FloatingWindow
          title="设置"
          defaultPosition={{ x: 520, y: 100 }}
          defaultSize={{ width: 280, height: 180 }}
          onClose={toggleSettings}
          showVersion={false}
          style={{
            backgroundColor: theme.background,
            color: theme.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            boxShadow: theme.shadow,
            border: 'none',
            borderRadius: '8px'
          }}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 设置内容 */}
            <div style={{ 
              flex: 1, 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* 调试模式开关 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: theme.text, fontSize: '13px' }}>
                    调试模式
                  </div>
                  <div style={{ fontSize: '11px', color: theme.textLight }}>
                    启用调试信息输出
                  </div>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '36px',
                  height: '20px'
                }}>
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={toggleDebugMode}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: debugMode ? theme.primary : '#ccc',
                    transition: '0.3s',
                    borderRadius: '20px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '14px',
                      width: '14px',
                      left: debugMode ? '16px' : '2px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>

              {/* 其他设置项占位 */}
              <div style={{
                padding: '8px',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: theme.textLight }}>
                  更多设置选项将在后续版本中添加
                </div>
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div style={{
              padding: '12px',
              borderTop: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <Button 
                onClick={toggleSettings} 
                variant="secondary" 
                size="small"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                关闭
              </Button>
            </div>
          </div>
        </FloatingWindow>
      )}
    </>
  );
};
