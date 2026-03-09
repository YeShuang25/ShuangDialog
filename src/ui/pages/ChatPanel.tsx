// 聊天面板主组件
import React, { useState } from 'react';
import { FloatingWindow } from '../components/FloatingWindow';

export const ChatPanel: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
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
          <div style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '8px',
            backgroundColor: '#f9f9f9',
            overflowY: 'auto',
            minHeight: '200px'
          }}>
            {/* 这里是消息内容显示区域 */}
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              消息内容将在这里显示...
            </div>
          </div>

          {/* 输入框区域 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="输入要说的话..."
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={toggleSettings}
              style={{
                padding: '8px 12px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              设置
            </button>
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
