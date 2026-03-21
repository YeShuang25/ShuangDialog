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
    filterEnabled,
    commandEnabled,
    setBotToken, 
    setChatId, 
    setEnabled,
    setFilterEnabled,
    setCommandEnabled,
    testConnection 
  } = useTelegramStore();
  
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 420, height: 580 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
    setResizeStartSize(size);
  }, [size]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
    if (isResizing) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;
      const newWidth = Math.max(350, resizeStartSize.width + deltaX / scale);
      const newHeight = Math.max(400, resizeStartSize.height + deltaY / scale);
      setSize({
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, dragOffset, scale, resizeStartSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
            width: `${size.width * scale}px`,
            height: `${size.height * scale}px`,
            maxWidth: '95vw',
            maxHeight: '90vh',
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
              userSelect: 'none',
              flexShrink: 0
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
          
          <div 
            style={{ 
              padding: `${16 * scale}px`,
              overflowY: 'auto',
              flex: 1
            }}
          >
            <div 
              onClick={() => setShowHelp(!showHelp)}
              style={{ 
                marginBottom: `${16 * scale}px`,
                padding: `${12 * scale}px`,
                backgroundColor: '#f0f7ff',
                borderRadius: `${8 * scale}px`,
                fontSize: `${12 * scale}px`,
                color: '#666',
                lineHeight: 1.6,
                cursor: 'pointer',
                userSelect: 'none'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: '#007acc' }}>📖 配置教程</strong>
                <span style={{ fontSize: `${14 * scale}px` }}>{showHelp ? '▼' : '▶'}</span>
              </div>
              {showHelp && (
                <div style={{ marginTop: `${12 * scale}px` }}>
                  <div style={{ marginBottom: `${12 * scale}px` }}>
                    <strong style={{ color: '#333' }}>1️⃣ 创建Bot获取Token</strong>
                    <div style={{ marginTop: `${4 * scale}px`, paddingLeft: `${8 * scale}px` }}>
                      • 在Telegram搜索 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>@BotFather</code><br/>
                      • 发送 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>/newbot</code><br/>
                      • 按提示设置Bot名称<br/>
                      • 获得Token（格式：数字:字母数字组合）
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: `${12 * scale}px` }}>
                    <strong style={{ color: '#333' }}>2️⃣ 获取Chat ID</strong>
                    <div style={{ marginTop: `${4 * scale}px`, paddingLeft: `${8 * scale}px` }}>
                      <strong style={{ color: '#666' }}>个人聊天：</strong><br/>
                      • 访问 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px', fontSize: `${10 * scale}px` }}>https://api.telegram.org/bot你的Token/getUpdates</code><br/>
                      • 给Bot发一条消息后刷新页面<br/>
                      • 找到 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>&quot;chat&quot;:&#123;&quot;id&quot;:123456789&#125;</code><br/><br/>
                      <strong style={{ color: '#666' }}>群组聊天：</strong><br/>
                      • 将Bot加入群组<br/>
                      • 群组ID格式为 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>-100</code> 开头<br/>
                      • 同样通过getUpdates获取
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: `${12 * scale}px` }}>
                    <strong style={{ color: '#e65100' }}>⚠️ 重要：禁用隐私模式</strong>
                    <div style={{ marginTop: `${4 * scale}px`, paddingLeft: `${8 * scale}px` }}>
                      Bot默认只能看到命令消息，需禁用隐私模式：<br/>
                      • 找 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>@BotFather</code> 发送 <code style={{ backgroundColor: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>/mybots</code><br/>
                      • 选择你的Bot<br/>
                      • Bot Settings → Group Privacy<br/>
                      • 选择 <strong>Disable</strong> 禁用<br/><br/>
                      <span style={{ color: '#e65100' }}>或者在群组中将Bot设为管理员</span>
                    </div>
                  </div>
                </div>
              )}
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

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: `${16 * scale}px`,
              padding: `${12 * scale}px`,
              backgroundColor: '#f5f5f5',
              borderRadius: `${8 * scale}px`
            }}>
              <div>
                <span style={{ fontSize: `${14 * scale}px`, fontWeight: 500 }}>
                  {filterEnabled ? '🔍 仅转发筛选消息' : '📢 转发所有消息'}
                </span>
                <div style={{ fontSize: `${11 * scale}px`, color: '#666', marginTop: `${4 * scale}px` }}>
                  {filterEnabled ? '只转发符合特别关注规则的消息' : '转发所有聊天消息到Telegram'}
                </div>
              </div>
              <button
                onClick={() => setFilterEnabled(!filterEnabled)}
                style={{
                  padding: `${8 * scale}px ${16 * scale}px`,
                  backgroundColor: filterEnabled ? '#2196f3' : '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: `${6 * scale}px`,
                  cursor: 'pointer',
                  fontSize: `${12 * scale}px`,
                  fontWeight: 500
                }}
              >
                {filterEnabled ? '关闭筛选' : '开启筛选'}
              </button>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: `${16 * scale}px`,
              padding: `${12 * scale}px`,
              backgroundColor: '#f5f5f5',
              borderRadius: `${8 * scale}px`
            }}>
              <div>
                <span style={{ fontSize: `${14 * scale}px`, fontWeight: 500 }}>
                  {commandEnabled ? '🎮 远程命令已启用' : '🎮 远程命令已禁用'}
                </span>
                <div style={{ fontSize: `${11 * scale}px`, color: '#666', marginTop: `${4 * scale}px` }}>
                  通过Telegram发送消息到游戏聊天
                </div>
              </div>
              <button
                onClick={() => setCommandEnabled(!commandEnabled)}
                style={{
                  padding: `${8 * scale}px ${16 * scale}px`,
                  backgroundColor: commandEnabled ? '#4caf50' : '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: `${6 * scale}px`,
                  cursor: 'pointer',
                  fontSize: `${12 * scale}px`,
                  fontWeight: 500
                }}
              >
                {commandEnabled ? '禁用' : '启用'}
              </button>
            </div>

            {commandEnabled && (
              <div style={{ 
                marginBottom: `${16 * scale}px`,
                padding: `${12 * scale}px`,
                backgroundColor: '#e3f2fd',
                borderRadius: `${8 * scale}px`,
                fontSize: `${12 * scale}px`,
                color: '#1565c0'
              }}>
                <strong>可用命令：</strong><br/>
                /say &lt;消息&gt; - 发送普通聊天<br/>
                /emote &lt;动作&gt; - 发送动作消息<br/>
                /players - 查询房间玩家列表<br/>
                /help - 显示帮助<br/><br/>
                <strong>快捷方式：</strong><br/>
                直接发送消息 - 普通聊天<br/>
                *动作内容 - 发送动作消息<br/><br/>
                <strong>示例：</strong><br/>
                你好 → 发送"你好"<br/>
                *微微一笑 → 发送动作"微微一笑"
              </div>
            )}

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

          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: `${16 * scale}px`,
              height: `${16 * scale}px`,
              cursor: 'nwse-resize',
              backgroundColor: 'transparent',
              zIndex: 10
            }}
          >
            <svg
              width={16 * scale}
              height={16 * scale}
              viewBox="0 0 16 16"
              style={{ position: 'absolute', right: 0, bottom: 0 }}
            >
              <path
                d="M14 14L8 14L14 8L14 14Z"
                fill="#ccc"
              />
              <path
                d="M10 14L6 14L14 6L14 10L10 14Z"
                fill="#ddd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
