import React, { useState, useEffect, useCallback } from 'react';
import { MiniMenu, MenuItem, MenuDivider, MenuCollapse, MenuSlider } from './MiniMenu';
import { useDebugStore } from '../../store/useDebugStore';
import { useChatMonitorStore } from '../../store/useChatMonitorStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useShuangConfigStore } from '../../store/useShuangConfigStore';
import { isChatLogAvailable, showExportOptionsDialog } from '../../utils/chatExporter';
import { APP_VERSION } from '../../config/version';
import { PlayerIdConfig } from './PlayerIdConfig';
import { getAllDebugModules, toggleDebugModule, DebugModule } from '../../config/debug';
import { useSimpleDrag } from '../hooks/useDrag';
import { useScale } from '../context/ScaleContext';

export const MiniFloatingBall: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlayerIdConfigOpen, setIsPlayerIdConfigOpen] = useState(false);
  const [openCollapseKey, setOpenCollapseKey] = useState<string | null>(null);
  const [debugModules, setDebugModules] = useState(() => getAllDebugModules());
  const scale = useScale();

  const { debugMode, toggleDebugMode } = useDebugStore();
  const { chatMonitorEnabled, toggleChatMonitor } = useChatMonitorStore();
  const { fontScale, setFontScale } = useShuangConfigStore();

  const handleToggleDebugModule = (module: DebugModule) => {
    toggleDebugModule(module);
    setDebugModules(getAllDebugModules());
  };

  const getDebugModuleLabel = (module: DebugModule): string => {
    const labels: Record<DebugModule, string> = {
      SHUANG_CHAT_BOX: '聊天框',
      CHAT_EXPORTER: '导出',
      FLOATING_BALL: '悬浮球',
      MESSAGE_FILTER: '消息筛选'
    };
    return labels[module];
  };

  const handleCollapseToggle = (key: string) => {
    setOpenCollapseKey(prev => prev === key ? null : key);
  };

  const { position, setPosition, isDragging, bindDragEvents, getDragDistance } = useSimpleDrag(
    Math.round(20 * scale), 
    Math.round(100 * scale),
    Math.round(60 * scale),
    Math.round(30 * scale)
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shuang-dialog-position');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosition({ x: parsed.x, y: parsed.y });
      }
    } catch (error) {
      console.warn('Failed to load position:', error);
    }
  }, []);

  const savePosition = useCallback((newPos: { x: number; y: number }) => {
    try {
      localStorage.setItem('shuang-dialog-position', JSON.stringify(newPos));
    } catch (error) {
      console.warn('Failed to save position:', error);
    }
  }, []);

  useEffect(() => {
    if (!isDragging) {
      savePosition(position);
    }
  }, [position, isDragging, savePosition]);

  const handleClick = useCallback(() => {
    if (getDragDistance() < 5) {
      setIsMenuOpen(!isMenuOpen);
    }
  }, [isMenuOpen, getDragDistance]);

  const handleExport = () => {
    try {
      if (!isChatLogAvailable()) {
        console.error('[ShuangDialog] 聊天框组件未找到');
        return;
      }
      showExportOptionsDialog();
    } catch (error) {
      console.error('[ShuangDialog] 导出失败:', error);
    }
    setIsMenuOpen(false);
  };

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

  const handleClearActivity = () => {
    useActivityStore.getState().clearActivityPackets();
    setIsMenuOpen(false);
  };

  return (
    <>
      <div
        {...bindDragEvents}
        onClick={handleClick}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: `${60 * scale}px`,
          height: `${30 * scale}px`,
          backgroundColor: '#007acc',
          color: 'white',
          borderRadius: `${15 * scale}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          fontSize: `${12 * scale}px`,
          fontWeight: 500,
          userSelect: 'none',
          touchAction: 'none',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)'
        }}
        title={`霜语 ${APP_VERSION}`}
      >
        霜语
      </div>

      <MiniMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={position}
      >
        <MenuCollapse 
          icon="💬" 
          label="霜语文本框" 
          isOpen={openCollapseKey === 'chatbox'}
          onToggle={() => handleCollapseToggle('chatbox')}
        >
          <MenuSlider
            label="字体大小"
            value={fontScale}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={(value) => setFontScale(value)}
            displayValue={`${fontScale.toFixed(1)}x`}
          />
          <MenuItem
            icon="👤"
            label="特别关注玩家"
            onClick={() => {
              setIsPlayerIdConfigOpen(true);
              setIsMenuOpen(false);
            }}
          />
        </MenuCollapse>
        
        <MenuDivider />
        
        <MenuItem
          icon="📥"
          label="导出聊天框"
          onClick={handleExport}
        />
        
        <MenuDivider />
        
        <MenuCollapse 
          icon="🔧" 
          label="调试工具"
          isOpen={openCollapseKey === 'debug'}
          onToggle={() => handleCollapseToggle('debug')}
        >
          <MenuItem
            icon={debugMode ? '🔵' : '⚪'}
            label="调试模式"
            onClick={() => {
              toggleDebugMode();
            }}
            active={debugMode}
          />
          <MenuItem
            icon={chatMonitorEnabled ? '👁️' : '🚫'}
            label="聊天监控"
            onClick={() => {
              toggleChatMonitor();
            }}
            active={chatMonitorEnabled}
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
          <div style={{ padding: `${4 * scale}px ${12 * scale}px`, fontSize: `${11 * scale}px`, color: '#888' }}>
            调试日志开关
          </div>
          {debugModules.map(({ module, enabled }) => (
            <MenuItem
              key={module}
              icon={enabled ? '📝' : '⬜'}
              label={getDebugModuleLabel(module)}
              onClick={() => handleToggleDebugModule(module)}
              active={enabled}
            />
          ))}
        </MenuCollapse>
        
        <MenuDivider />
        <div style={{
          padding: `${8 * scale}px ${12 * scale}px`,
          fontSize: `${11 * scale}px`,
          color: '#999',
          textAlign: 'center'
        }}>
          {APP_VERSION}
        </div>
      </MiniMenu>

      <PlayerIdConfig
        isOpen={isPlayerIdConfigOpen}
        onClose={() => setIsPlayerIdConfigOpen(false)}
      />
    </>
  );
};
