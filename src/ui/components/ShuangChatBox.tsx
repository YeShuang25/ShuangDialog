import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';
import { createPortal } from 'react-dom';

const MIN_HEIGHT_RATIO = 0.1;
const MAX_HEIGHT_RATIO = 0.9;
const DEFAULT_HEIGHT_RATIO = 0.33;

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [heightRatio, setHeightRatio] = useState(DEFAULT_HEIGHT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const isInitializedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartRatioRef = useRef(DEFAULT_HEIGHT_RATIO);

  const updateStyles = useCallback((ratio: number) => {
    if (styleElementRef.current) {
      styleElementRef.current.textContent = `
        #chat-room-div:not([hidden]) {
          display: flex !important;
          flex-direction: column !important;
        }
        #TextAreaChatLog {
          flex: ${1 - ratio} !important;
          min-height: 0 !important;
        }
        #chat-room-bot {
          flex-shrink: 0 !important;
        }
        .shuang-chat-box-container {
          flex: ${ratio};
          min-height: 80px;
          background-color: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid #ccc;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1;
        }
        .shuang-chat-box-header {
          padding: 8px 12px;
          background-color: #007acc;
          color: white;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 1px solid #005a9e;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          user-select: none;
          position: relative;
        }
        .shuang-chat-box-resize-handle {
          width: 100%;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.5);
          cursor: row-resize;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          transition: background-color 0.2s;
          z-index: 2;
        }
        .shuang-chat-box-resize-handle:hover {
          background-color: rgba(255, 255, 255, 0.8);
        }
        .shuang-chat-box-resize-handle.dragging {
          background-color: #ffffff;
        }
        .shuang-chat-box-content {
          flex: 1;
          overflow: auto;
          padding: 8px;
          font-size: 14px;
          color: #333;
        }
        #shuang-chat-box-portal[hidden] {
          display: none !important;
        }
        #shuang-chat-box-portal {
          display: flex;
          flex-direction: column;
        }
      `;
    }
  }, []);

  useEffect(() => {
    console.log('[ShuangDialog] 霜语开关状态:', chatBoxEnabled);

    const gameChatBoxElement = document.getElementById('chat-room-div');
    const textAreaElement = document.getElementById('TextAreaChatLog');

    if (!gameChatBoxElement || !textAreaElement) {
      console.warn('[ShuangDialog] 未找到游戏文本框元素');
      return;
    }

    if (!isInitializedRef.current) {
      console.log('[ShuangDialog] 初始化霜语组件');

      const styleEl = document.createElement('style');
      styleEl.id = 'shuang-chat-box-style';
      document.head.appendChild(styleEl);
      styleElementRef.current = styleEl;

      const container = document.createElement('div');
      container.id = 'shuang-chat-box-portal';
      gameChatBoxElement.insertBefore(container, textAreaElement);
      setPortalContainer(container);
      isInitializedRef.current = true;

      observerRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
            const portalEl = document.getElementById('shuang-chat-box-portal');
            if (gameChatBoxElement.hasAttribute('hidden')) {
              console.log('[ShuangDialog] 检测到游戏隐藏，同步隐藏霜语');
              portalEl?.setAttribute('hidden', '');
            } else if (chatBoxEnabled) {
              console.log('[ShuangDialog] 检测到游戏显示，同步显示霜语');
              portalEl?.removeAttribute('hidden');
            }
          }
        });
      });

      observerRef.current.observe(gameChatBoxElement, {
        attributes: true,
        attributeFilter: ['hidden']
      });

      if (gameChatBoxElement.hasAttribute('hidden')) {
        container.setAttribute('hidden', '');
      }

      updateStyles(heightRatio);

      console.log('[ShuangDialog] 已初始化霜语组件');
    }

    const portalEl = document.getElementById('shuang-chat-box-portal');
    if (portalEl) {
      if (chatBoxEnabled) {
        if (gameChatBoxElement.hasAttribute('hidden')) {
          portalEl.setAttribute('hidden', '');
        } else {
          portalEl.removeAttribute('hidden');
        }
        updateStyles(heightRatio);
        console.log('[ShuangDialog] 显示霜语');
      } else {
        portalEl.setAttribute('hidden', '');
        console.log('[ShuangDialog] 隐藏霜语');
      }
    }

    return () => {
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      const existingContainer = document.getElementById('shuang-chat-box-portal');
      if (existingContainer) {
        existingContainer.remove();
      }
      isInitializedRef.current = false;
    };
  }, [chatBoxEnabled, heightRatio, updateStyles]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const gameChatBoxElement = document.getElementById('chat-room-div');
      if (!gameChatBoxElement) return;

      const gameRect = gameChatBoxElement.getBoundingClientRect();
      const deltaY = e.clientY - dragStartYRef.current;
      const deltaRatio = deltaY / gameRect.height;
      const newRatio = Math.max(MIN_HEIGHT_RATIO, Math.min(MAX_HEIGHT_RATIO, dragStartRatioRef.current + deltaRatio));

      setHeightRatio(newRatio);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        console.log('[ShuangDialog] 拖拽结束，最终高度比例:', heightRatio);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, heightRatio]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartRatioRef.current = heightRatio;
    console.log('[ShuangDialog] 开始拖拽调整高度');
  };

  if (!portalContainer) {
    return null;
  }

  return createPortal(
    <div className="shuang-chat-box-container">
      <div className="shuang-chat-box-header">
        <span>霜语</span>
        <div 
          className={`shuang-chat-box-resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          title="拖拽调整高度"
        />
      </div>
      <div className="shuang-chat-box-content">
        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
          内容区域（待实现）
        </div>
      </div>
    </div>,
    portalContainer
  );
};
