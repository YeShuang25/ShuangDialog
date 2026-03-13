import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';
import { useShuangMessagesStore } from '../../store/useShuangMessagesStore';
import { createPortal } from 'react-dom';
import { log } from '../../config/debug';
import { messageFilter } from '../../utils/messageFilter';

const MIN_HEIGHT_RATIO = 0.1;
const MAX_HEIGHT_RATIO = 0.9;
const DEFAULT_HEIGHT_RATIO = 0.33;

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const { messages } = useShuangMessagesStore();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [heightRatio, setHeightRatio] = useState(DEFAULT_HEIGHT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const isInitializedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartRatioRef = useRef(DEFAULT_HEIGHT_RATIO);
  const originalHeightRef = useRef<string>('');
  const domWatcherRef = useRef<MutationObserver | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const messageFilterStartedRef = useRef(false);

  const updateStyles = useCallback((ratio: number, enabled: boolean) => {
    if (styleElementRef.current) {
      if (enabled) {
        styleElementRef.current.textContent = `
          #chat-room-div:not([hidden]) {
            display: flex !important;
            flex-direction: column !important;
          }
          
          #shuang-chat-box-portal {
            display: flex;
            flex-direction: column;
            flex: ${ratio};
            min-height: 60px;
            background-color: rgba(255, 255, 255, 0.95);
            border-bottom: 2px solid #007acc;
          }
          
          #shuang-chat-box-portal[hidden] {
            display: none !important;
          }
          
          #TextAreaChatLog {
            flex: ${1 - ratio} !important;
            min-height: 60px !important;
            height: auto !important;
          }
          
          #chat-room-bot {
            flex-shrink: 0 !important;
          }
          
          .shuang-header {
            padding: 8px 12px;
            background-color: #007acc;
            color: white;
            font-size: 14px;
            font-weight: 500;
            user-select: none;
            flex-shrink: 0;
          }
          
          .shuang-content {
            flex: 1;
            overflow: auto;
            padding: 4px;
            font-size: 14px;
            color: #333;
            min-height: 0;
          }
          
          .shuang-drag-handle {
            height: 6px;
            background-color: #007acc;
            cursor: row-resize;
            flex-shrink: 0;
            transition: background-color 0.2s;
          }
          
          .shuang-drag-handle:hover {
            background-color: #005a9e;
          }
          
          .shuang-drag-handle.dragging {
            background-color: #004578;
          }
          
          .shuang-message-wrapper {
            margin-bottom: 4px;
            padding: 2px 4px;
            background-color: rgba(0, 122, 204, 0.05);
            border-left: 3px solid #007acc;
            border-radius: 4px;
          }
          
          .shuang-message-wrapper .ChatMessage {
            margin: 0;
            padding: 2px 0;
          }
          
          .shuang-empty-hint {
            color: #999;
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
          }
        `;
      } else {
        styleElementRef.current.textContent = `
          #TextAreaChatLog {
            flex: none !important;
            height: ${originalHeightRef.current} !important;
            min-height: 0 !important;
          }
        `;
      }
    }
  }, []);

  const initializeShuangChatBox = useCallback(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    const textAreaElement = document.getElementById('TextAreaChatLog');

    if (!gameChatBoxElement || !textAreaElement) {
      log('SHUANG_CHAT_BOX', '聊天框元素尚未出现，等待中...');
      return false;
    }

    if (isInitializedRef.current) {
      return true;
    }

    log('SHUANG_CHAT_BOX', '初始化霜语组件');

    const styleEl = document.createElement('style');
    styleEl.id = 'shuang-chat-box-style';
    document.head.appendChild(styleEl);
    styleElementRef.current = styleEl;

    const container = document.createElement('div');
    container.id = 'shuang-chat-box-portal';
    gameChatBoxElement.insertBefore(container, textAreaElement);
    setPortalContainer(container);
    isInitializedRef.current = true;

    const originalHeight = textAreaElement.style.height || 'auto';
    originalHeightRef.current = originalHeight;
    log('SHUANG_CHAT_BOX', '保存游戏文本框原始高度:', originalHeight);

    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
          const portalEl = document.getElementById('shuang-chat-box-portal');
          if (gameChatBoxElement.hasAttribute('hidden')) {
            log('SHUANG_CHAT_BOX', '检测到游戏隐藏，同步隐藏霜语');
            portalEl?.setAttribute('hidden', '');
          } else if (chatBoxEnabled) {
            log('SHUANG_CHAT_BOX', '检测到游戏显示，同步显示霜语');
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

    updateStyles(heightRatio, chatBoxEnabled);

    log('SHUANG_CHAT_BOX', '已初始化霜语组件');
    return true;
  }, [chatBoxEnabled, heightRatio, updateStyles]);

  useEffect(() => {
    log('SHUANG_CHAT_BOX', '霜语开关状态:', chatBoxEnabled);

    if (initializeShuangChatBox()) {
      const gameChatBoxElement = document.getElementById('chat-room-div');
      const portalEl = document.getElementById('shuang-chat-box-portal');
      
      if (portalEl && gameChatBoxElement) {
        if (chatBoxEnabled) {
          if (gameChatBoxElement.hasAttribute('hidden')) {
            portalEl.setAttribute('hidden', '');
          } else {
            portalEl.removeAttribute('hidden');
          }
          updateStyles(heightRatio, true);
          
          if (!messageFilterStartedRef.current) {
            messageFilter.start();
            messageFilterStartedRef.current = true;
            log('SHUANG_CHAT_BOX', '启动消息筛选器');
          }
        } else {
          portalEl.setAttribute('hidden', '');
          updateStyles(heightRatio, false);
          
          if (messageFilterStartedRef.current) {
            messageFilter.stop();
            messageFilterStartedRef.current = false;
            log('SHUANG_CHAT_BOX', '停止消息筛选器');
          }
        }
      }
    } else {
      if (!domWatcherRef.current) {
        log('SHUANG_CHAT_BOX', '启动 DOM 监听器，等待聊天框出现');
        
        domWatcherRef.current = new MutationObserver(() => {
          if (initializeShuangChatBox()) {
            log('SHUANG_CHAT_BOX', '聊天框已出现，停止 DOM 监听');
            domWatcherRef.current?.disconnect();
            domWatcherRef.current = null;
          }
        });

        domWatcherRef.current.observe(document.body, {
          childList: true,
          subtree: true
        });
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
      if (domWatcherRef.current) {
        domWatcherRef.current.disconnect();
        domWatcherRef.current = null;
      }
      const existingContainer = document.getElementById('shuang-chat-box-portal');
      if (existingContainer) {
        existingContainer.remove();
      }
      isInitializedRef.current = false;
      if (messageFilterStartedRef.current) {
        messageFilter.stop();
        messageFilterStartedRef.current = false;
      }
    };
  }, [chatBoxEnabled]);

  useEffect(() => {
    if (isInitializedRef.current && chatBoxEnabled) {
      updateStyles(heightRatio, true);
    }
  }, [heightRatio, chatBoxEnabled, updateStyles]);

  useEffect(() => {
    if (contentRef.current && messages.length > 0) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

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
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartRatioRef.current = heightRatio;
  };

  if (!portalContainer) {
    return null;
  }

  return createPortal(
    <>
      <div className="shuang-header">
        霜语 {messages.length > 0 && `(${messages.length})`}
      </div>
      <div className="shuang-content" ref={contentRef}>
        {messages.length === 0 ? (
          <div className="shuang-empty-hint">
            暂无关注的消息
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="shuang-message-wrapper" dangerouslySetInnerHTML={{ __html: msg.originalElement.outerHTML }} />
          ))
        )}
      </div>
      <div 
        className={`shuang-drag-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        title="拖拽调整高度"
      />
    </>,
    portalContainer
  );
};
