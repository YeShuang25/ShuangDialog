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
        defaultSize={{ width: 420, height: 600 }}
        showHeader={false}
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '14px',
          boxShadow: theme.shadow,
          border: 'none',
          borderRadius: '12px'
        }}
      >
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          {/* 标题栏 */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: `1px solid ${theme.border}`,
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #4cd964 0%, #34e89e 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(76, 217, 100, 0.4)'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>霜语助手</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>在线</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button 
                onClick={toggleSettings} 
                variant="secondary" 
                size="small"
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '20px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ⚙️ 设置
              </Button>
            </div>
          </div>

          {/* 消息显示区域 */}
          <div style={{ 
            flex: 1, 
            padding: '20px', 
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)'
          }}>
            <MessageList messages={messages} />
          </div>

          {/* 输入框区域 */}
          <div style={{ 
            padding: '20px', 
            borderTop: `1px solid ${theme.border}`,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}>
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      </FloatingWindow>

      {/* 设置弹窗 */}
      {showSettings && (
        <FloatingWindow
          title="设置"
          defaultPosition={{ x: 520, y: 100 }}
          defaultSize={{ width: 320, height: 280 }}
          onClose={toggleSettings}
          style={{
            backgroundColor: theme.background,
            color: theme.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            boxShadow: theme.shadow,
            border: 'none',
            borderRadius: '12px'
          }}
        >
          <div style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>
            {/* 设置标题 */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderBottom: `1px solid ${theme.border}`,
              borderRadius: '12px 12px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>设置选项</h3>
            </div>

            {/* 设置内容 */}
            <div style={{ 
              flex: 1, 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* 调试模式开关 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
                    调试模式
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textLight }}>
                    启用详细的调试信息输出
                  </div>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '44px',
                  height: '24px'
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
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: debugMode ? '20px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

              {/* 其他设置项占位 */}
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: theme.textLight }}>
                  更多设置选项将在后续版本中添加
                </div>
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div style={{
              padding: '16px',
              borderTop: `1px solid ${theme.border}`,
              background: 'rgba(255,255,255,0.8)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <Button 
                onClick={toggleSettings} 
                variant="secondary" 
                size="small"
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
