import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTelegramStore } from '../../store/useTelegramStore';
import { useScale } from '../context/ScaleContext';

interface TelegramConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramConfig: React.FC<TelegramConfigProps> = ({ isOpen, onClose }) => {
  const { 
    botToken, 
    chatId, 
    enabled, 
    setBotToken, 
    setChatId, 
    setEnabled,
    testConnection 
  } = useTelegramStore();
  
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const scale = useScale();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001
      }}
    >
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 10002,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: `${12 * scale}px`,
            padding: 0,
            width: `${400 * scale}px`,
            maxWidth: '95vw',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: `${1 * scale}px solid #ddd`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="modal-header"
            style={{
              padding: `${12 * scale}px ${16 * scale}px`,
              borderBottom: `${1 * scale}px solid #eee`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'grab',
              backgroundColor: '#f8f9fa',
              borderRadius: `${12 * scale}px ${12 * scale}px 0 0`,
              userSelect: 'none'
            }}
          >
            <h2 style={{ margin: 0, fontSize: `${15 * scale}px`, color: '#333', fontWeight: 600 }}>
              Telegram 转发配置
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: `${4 * scale}px ${12 * scale}px`,
                backgroundColor: '#e0e0e0',
                color: '#666',
                border: 'none',
                borderRadius: `${4 * scale}px`,
                cursor: 'pointer',
                fontSize: `${12 * scale}px`
              }}
            >
              关闭
            </button>
          </div>
          
          <div style={{ padding: `${16 * scale}px` }}>
            <div style={{ 
              marginBottom: `${16 * scale}px`,
              padding: `${12 * scale}px`,
              backgroundColor: '#f0f7ff',
              borderRadius: `${8 * scale}px`,
              fontSize: `${12 * scale}px`,
              color: '#666',
              lineHeight: 1.6
            }}>
              <strong style={{ color: '#007acc' }}>使用说明：</strong><br/>
              1. 在 Telegram 中找 @BotFather 创建机器人获取 Token<br/>
              2. 获取目标 Chat ID（个人或群组）<br/>
              3. 启用转发后，霜语中的消息会同步发送到 Telegram
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: `${16 * scale}px`,
              padding: `${12 * scale}px`,
              backgroundColor: enabled ? '#e8f5e9' : '#fff3e0',
              borderRadius: `${8 * scale}px`
            }}>
              <span style={{ fontSize: `${14 * scale}px`, fontWeight: 500 }}>
                {enabled ? '✅ 转发已启用' : '⏸️ 转发已禁用'}
              </span>
              <button
                onClick={() => setEnabled(!enabled)}
                style={{
                  padding: `${8 * scale}px ${16 * scale}px`,
                  backgroundColor: enabled ? '#ff9800' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: `${6 * scale}px`,
                  cursor: 'pointer',
                  fontSize: `${12 * scale}px`,
                  fontWeight: 500
                }}
              >
                {enabled ? '禁用' : '启用'}
              </button>
            </div>

            <div style={{ marginBottom: `${16 * scale}px` }}>
              <label style={{ 
                display: 'block', 
                marginBottom: `${6 * scale}px`, 
                fontSize: `${13 * scale}px`,
                fontWeight: 500,
                color: '#333'
              }}>
                Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="例如：123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                style={{
                  width: '100%',
                  padding: `${10 * scale}px ${12 * scale}px`,
                  border: `${1 * scale}px solid #ddd`,
                  borderRadius: `${6 * scale}px`,
                  fontSize: `${13 * scale}px`,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: `${16 * scale}px` }}>
              <label style={{ 
                display: 'block', 
                marginBottom: `${6 * scale}px`, 
                fontSize: `${13 * scale}px`,
                fontWeight: 500,
                color: '#333'
              }}>
                Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="例如：-1001234567890 或 123456789"
                style={{
                  width: '100%',
                  padding: `${10 * scale}px ${12 * scale}px`,
                  border: `${1 * scale}px solid #ddd`,
                  borderRadius: `${6 * scale}px`,
                  fontSize: `${13 * scale}px`,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: `${8 * scale}px` }}>
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !botToken}
                style={{
                  flex: 1,
                  padding: `${10 * scale}px`,
                  backgroundColor: isTesting || !botToken ? '#ccc' : '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: `${6 * scale}px`,
                  cursor: isTesting || !botToken ? 'not-allowed' : 'pointer',
                  fontSize: `${13 * scale}px`,
                  fontWeight: 500
                }}
              >
                {isTesting ? '测试中...' : '测试连接'}
              </button>
            </div>

            {testResult && (
              <div style={{
                marginTop: `${12 * scale}px`,
                padding: `${10 * scale}px ${12 * scale}px`,
                backgroundColor: testResult.success ? '#e8f5e9' : '#ffebee',
                borderRadius: `${6 * scale}px`,
                fontSize: `${12 * scale}px`,
                color: testResult.success ? '#2e7d32' : '#c62828'
              }}>
                {testResult.success ? '✅ ' : '❌ '}{testResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
