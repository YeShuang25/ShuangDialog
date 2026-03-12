import React, { useState, useEffect, useCallback } from 'react';
import { MiniMenu, MenuItem, MenuDivider } from './MiniMenu';
import { useDebugStore } from '../../store/useDebugStore';
import { useChatMonitorStore } from '../../store/useChatMonitorStore';
import { useActivityStore } from '../../store/useActivityStore';
import { exportChatLogAsHTML, isChatLogAvailable } from '../../utils/chatExporter';
import { APP_VERSION } from '../../config/version';

export const MiniFloatingBall: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const { debugMode, toggleDebugMode } = useDebugStore();
  const { chatMonitorEnabled, toggleChatMonitor } = useChatMonitorStore();

  // 从localStorage加载位置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shuang-dialog-position');
      if (saved) {
        setPosition(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load position:', error);
    }
  }, []);

  // 保存位置
  const savePosition = useCallback((newPos: { x: number; y: number }) => {
    try {
      localStorage.setItem('shuang-dialog-position', JSON.stringify(newPos));
    } catch (error) {
      console.warn('Failed to save position:', error);
    }
  }, []);

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setDragDistance(0);
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        // 限制在屏幕内
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        newX = Math.max(0, Math.min(screenWidth - 60, newX));
        newY = Math.max(0, Math.min(screenHeight - 30, newY));

        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        savePosition(newPosition);

        const distance = Math.sqrt(
          Math.pow(e.clientX - mouseDownPos.x, 2) +
          Math.pow(e.clientY - mouseDownPos.y, 2)
        );
        setDragDistance(distance);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, mouseDownPos, savePosition]);

  // 点击悬浮球
  const handleClick = useCallback(() => {
    if (dragDistance < 5) {
      setIsMenuOpen(!isMenuOpen);
    }
  }, [dragDistance, isMenuOpen]);

  // 处理导出
  const handleExport = () => {
    try {
      if (!isChatLogAvailable()) {
        console.error('[ShuangDialog] 聊天框组件未找到');
        return;
      }
      exportChatLogAsHTML({ includeStyles: true, format: 'html' });
    } catch (error) {
      console.error('[ShuangDialog] 导出失败:', error);
    }
    setIsMenuOpen(false);
  };

  // 下载Activity数据包
  const handleDownloadActivity = () => {
    const jsonData = useActivityStore.getState().getActivityPacketsAsJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_packets_${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  // 清空Activity数据
  const handleClearActivity = () => {
    useActivityStore.getState().clearActivityPackets();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* 悬浮球 */}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: '60px',
          height: '30px',
          backgroundColor: '#007acc',
          color: 'white',
          borderRadius: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          fontSize: '12px',
          fontWeight: 500,
          userSelect: 'none',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)'
        }}
        title={`霜语 ${APP_VERSION}`}
      >
        霜语
      </div>

      {/* 菜单 */}
      <MiniMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={position}
      >
        <MenuItem
          icon={debugMode ? '🔵' : '⚪'}
          label="调试模式"
          onClick={() => {
            toggleDebugMode();
            setIsMenuOpen(false);
          }}
          active={debugMode}
        />
        <MenuItem
          icon={chatMonitorEnabled ? '👁️' : '🚫'}
          label="聊天监控"
          onClick={() => {
            toggleChatMonitor();
            setIsMenuOpen(false);
          }}
          active={chatMonitorEnabled}
        />
        <MenuDivider />
        <MenuItem
          icon="📥"
          label="导出聊天框"
          onClick={handleExport}
        />
        <MenuItem
          icon="📦"
          label="下载Activity"
          onClick={handleDownloadActivity}
        />
        <MenuItem
          icon="🗑️"
          label="清空Activity"
          onClick={handleClearActivity}
        />
        <MenuDivider />
        <div style={{
          padding: '8px 12px',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center'
        }}>
          {APP_VERSION}
        </div>
      </MiniMenu>
    </>
  );
};