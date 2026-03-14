import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';
import { useShuangMessagesStore } from '../../store/useShuangMessagesStore';
import { useShuangConfigStore } from '../../store/useShuangConfigStore';
import { createPortal } from 'react-dom';
import { log } from '../../config/debug';
import { messageFilter } from '../../utils/messageFilter';

const MIN_HEIGHT_RATIO = 0.02;
const MAX_HEIGHT_RATIO = 0.9;
const DEFAULT_HEIGHT_RATIO = 0.33;
const COLLAPSED_THRESHOLD = 0.08;

const HEADER_HEIGHT_RATIO = 0.03;
const DRAG_HANDLE_HEIGHT_RATIO = 0.02;
const MIN_HEADER_HEIGHT = 12;
const MIN_DRAG_HANDLE_HEIGHT = 3;

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const messages = useShuangMessagesStore((state) => state.messages);
  const { fontScale, setFontScale } = useShuangConfigStore();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [heightRatio, setHeightRatio] = useState(DEFAULT_HEIGHT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const [localFontScale, setLocalFontScale] = useState(fontScale.toString());
  const [chatBoxHeight, setChatBoxHeight] = useState(300);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const isInitializedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartRatioRef = useRef(DEFAULT_HEIGHT_RATIO);
  const domWatcherRef = useRef<MutationObserver | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const messageFilterStartedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const calculateDynamicSizes = useCallback((containerHeight: number) => {
    const headerHeight = Math.max(MIN_HEADER_HEIGHT, Math.round(containerHeight * HEADER_HEIGHT_RATIO));
    const dragHandleHeight = Math.max(MIN_DRAG_HANDLE_HEIGHT, Math.round(containerHeight * DRAG_HANDLE_HEIGHT_RATIO));
    const fontSize = Math.max(8, Math.round(headerHeight * 0.6));
    const padding = Math.max(1, Math.round(headerHeight * 0.15));
    const gap = Math.max(1, Math.round(headerHeight * 0.1));
    const inputWidth = Math.max(25, Math.round(headerHeight * 2.5));
    
    return {
      headerHeight,
      dragHandleHeight,
      fontSize,
      padding,
      gap,
      inputWidth
    };
  }, []);

  const updateStyles = useCallback((ratio: number, enabled: boolean, scale: number, containerHeight: number) => {
    if (styleElementRef.current) {
      if (enabled) {
        const isCollapsed = ratio < COLLAPSED_THRESHOLD;
        const sizes = calculateDynamicSizes(containerHeight);
        
        styleElementRef.current.textContent = `
          #chat-room-div:not([hidden]) {
            display: flex !important;
            flex-direction: column !important;
          }
          
          #shuang-chat-box-portal {
            display: flex;
            flex-direction: column;
            flex: ${ratio};
            min-height: 20px;
            background-color: rgba(255, 255, 255, 0.95);
            border-bottom: 2px solid #007acc;
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
            height: ${sizes.headerHeight}px;
            padding: 0 ${sizes.padding}px;
            background-color: #007acc;
            color: white;
            font-size: ${sizes.fontSize}px;
            font-weight: 500;
            user-select: none;
            flex-shrink: 0;
            display: ${isCollapsed ? 'none' : 'flex'};
            align-items: center;
            justify-content: space-between;
          }
          
          .shuang-header-title {
            display: flex;
            align-items: center;
            gap: ${sizes.gap}px;
          }
          
          .shuang-header-controls {
            display: flex;
            align-items: center;
            gap: ${sizes.gap}px;
          }
          
          .shuang-font-scale-label {
            font-size: ${Math.max(8, sizes.fontSize - 2)}px;
            opacity: 0.9;
          }
          
          .shuang-font-scale-input {
            width: ${sizes.inputWidth}px;
            padding: ${Math.max(1, Math.floor(sizes.padding / 3))}px ${Math.max(2, Math.floor(sizes.padding / 2))}px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: ${Math.max(8, sizes.fontSize - 2)}px;
            text-align: center;
          }
          
          .shuang-font-scale-input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            background-color: rgba(255, 255, 255, 0.2);
          }
          
          .shuang-font-scale-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
          
          .shuang-content {
            flex: 1;
            overflow: auto;
            padding: ${Math.max(1, Math.floor(sizes.padding / 2))}px ${sizes.padding}px;
            font-size: calc(1em * ${scale});
            color: #333;
            min-height: 0;
            display: ${isCollapsed ? 'none' : 'block'};
          }
          
          .shuang-drag-handle {
            height: ${sizes.dragHandleHeight}px;
            background-color: #007acc;
            cursor: row-resize;
            flex-shrink: 0;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .shuang-drag-handle:hover {
            background-color: #005a9e;
          }
          
          .shuang-drag-handle.dragging {
            background-color: #004578;
          }
          
          .shuang-drag-handle::after {
            content: '';
            width: ${Math.max(12, Math.round(sizes.dragHandleHeight * 4))}px;
            height: ${Math.max(1, Math.round(sizes.dragHandleHeight * 0.25))}px;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 2px;
          }
          
          .shuang-empty-hint {
            color: #999;
            text-align: center;
            margin-top: ${sizes.padding}px;
            font-size: ${sizes.fontSize}px;
          }
        `;
      } else {
        styleElementRef.current.textContent = `
          #chat-room-div:not([hidden]) {
            display: block !important;
          }
          
          #shuang-chat-box-portal {
            display: none !important;
            flex: none !important;
          }
          
          #TextAreaChatLog {
            flex: none !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }
        `;
      }
    }
  }, [calculateDynamicSizes]);

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

    const initialHeight = gameChatBoxElement.getBoundingClientRect().height;
    setChatBoxHeight(initialHeight);

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        if (newHeight > 0) {
          setChatBoxHeight(newHeight);
        }
      }
    });
    resizeObserverRef.current.observe(gameChatBoxElement);

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
          
          if (!gameChatBoxElement.hasAttribute('hidden')) {
            const textArea = document.getElementById('TextAreaChatLog') as HTMLElement & { scrollTop?: number };
            if (textArea && textArea.scrollTop !== undefined) {
              setTimeout(() => {
                textArea.scrollTop = textArea.scrollHeight;
                log('SHUANG_CHAT_BOX', '游戏文本框重新显示，滚动到底部');
              }, 100);
            }
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

    updateStyles(heightRatio, chatBoxEnabled, fontScale, initialHeight);

    log('SHUANG_CHAT_BOX', '已初始化霜语组件');
    return true;
  }, [chatBoxEnabled, heightRatio, fontScale, updateStyles]);

  const startMessageFilter = useCallback(() => {
    if (!messageFilterStartedRef.current && chatBoxEnabled) {
      messageFilter.start();
      messageFilterStartedRef.current = true;
      log('SHUANG_CHAT_BOX', '启动消息筛选器');
    }
  }, [chatBoxEnabled]);

  const stopMessageFilter = useCallback(() => {
    if (messageFilterStartedRef.current) {
      messageFilter.stop();
      messageFilterStartedRef.current = false;
      log('SHUANG_CHAT_BOX', '停止消息筛选器');
    }
  }, []);

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
          updateStyles(heightRatio, true, fontScale, chatBoxHeight);
          startMessageFilter();
        } else {
          portalEl.setAttribute('hidden', '');
          updateStyles(heightRatio, false, fontScale, chatBoxHeight);
          stopMessageFilter();
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
            
            if (chatBoxEnabled) {
              startMessageFilter();
            }
          }
        });

        domWatcherRef.current.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
  }, [chatBoxEnabled, fontScale, chatBoxHeight]);

  useEffect(() => {
    if (isInitializedRef.current && chatBoxEnabled && styleElementRef.current) {
      updateStyles(heightRatio, true, fontScale, chatBoxHeight);
    }
  }, [heightRatio, chatBoxEnabled, fontScale, chatBoxHeight, updateStyles]);

  const handleFontScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalFontScale(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 2.0) {
      setFontScale(numValue);
    }
  }, [setFontScale]);

  const handleFontScaleBlur = useCallback(() => {
    const numValue = parseFloat(localFontScale);
    if (isNaN(numValue) || numValue < 0.5) {
      setLocalFontScale('0.5');
      setFontScale(0.5);
    } else if (numValue > 2.0) {
      setLocalFontScale('2.0');
      setFontScale(2.0);
    }
  }, [localFontScale, setFontScale]);

  const renderMessages = useCallback(() => {
    if (!contentRef.current) return;

    contentRef.current.innerHTML = '';

    if (messages.length === 0) {
      const emptyHint = document.createElement('div');
      emptyHint.className = 'shuang-empty-hint';
      emptyHint.textContent = '暂无关注的消息';
      contentRef.current.appendChild(emptyHint);
    } else {
      messages.forEach((msg) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'shuang-message-wrapper';
        const clonedElement = msg.originalElement.cloneNode(true) as HTMLElement;
        
        clonedElement.querySelectorAll('button[name="reply"]').forEach((clonedButton) => {
          const originalButton = msg.originalElement.querySelector('button[name="reply"]');
          if (originalButton) {
            clonedButton.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              (originalButton as HTMLElement).click();
            });
          }
        });
        
        clonedElement.querySelectorAll('.ChatMessageName').forEach((clonedNameBtn) => {
          const originalNameBtn = msg.originalElement.querySelector('.ChatMessageName');
          if (originalNameBtn) {
            clonedNameBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              (originalNameBtn as HTMLElement).click();
            });
          }
        });
        
        wrapper.appendChild(clonedElement);
        contentRef.current!.appendChild(wrapper);
      });
    }
  }, [messages]);

  useEffect(() => {
    if (chatBoxEnabled) {
      renderMessages();
    }
  }, [chatBoxEnabled, renderMessages]);

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

  useEffect(() => {
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
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      const existingContainer = document.getElementById('shuang-chat-box-portal');
      if (existingContainer) {
        existingContainer.remove();
      }
      isInitializedRef.current = false;
      stopMessageFilter();
    };
  }, [stopMessageFilter]);

  if (!portalContainer) {
    return null;
  }

  return createPortal(
    <>
      <div className="shuang-header">
        <div className="shuang-header-title">
          霜语 {messages.length > 0 && `(${messages.length})`}
        </div>
        <div className="shuang-header-controls">
          <span className="shuang-font-scale-label">字体:</span>
          <input
            type="number"
            className="shuang-font-scale-input"
            value={localFontScale}
            onChange={handleFontScaleChange}
            onBlur={handleFontScaleBlur}
            placeholder="1.0"
            min="0.5"
            max="2.0"
            step="0.1"
            title="字体倍数 (0.5-2.0)"
          />
        </div>
      </div>
      <div className="shuang-content" ref={contentRef}></div>
      <div 
        className={`shuang-drag-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        title="拖拽调整高度"
      />
    </>,
    portalContainer
  );
};
