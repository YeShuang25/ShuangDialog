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
  const { fontScale } = useShuangConfigStore();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [heightRatio, setHeightRatio] = useState(DEFAULT_HEIGHT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
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
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, []);

  const checkIfAtBottom = useCallback(() => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      return scrollHeight - scrollTop - clientHeight < 10;
    }
    return true;
  }, []);

  const calculateDynamicSizes = useCallback((containerHeight: number) => {
    const headerHeight = Math.max(MIN_HEADER_HEIGHT, Math.round(containerHeight * HEADER_HEIGHT_RATIO));
    const dragHandleHeight = Math.max(MIN_DRAG_HANDLE_HEIGHT, Math.round(containerHeight * DRAG_HANDLE_HEIGHT_RATIO));
    const fontSize = Math.max(8, Math.round(headerHeight * 0.6));
    const padding = Math.max(1, Math.round(headerHeight * 0.15));
    
    return {
      headerHeight,
      dragHandleHeight,
      fontSize,
      padding
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
            min-height: ${sizes.dragHandleHeight}px;
            background-color: rgba(255, 255, 255, 0.95);
            border-bottom: 2px solid #007acc;
            position: relative;
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
            height: ${isCollapsed ? 0 : sizes.headerHeight}px;
            padding: 0 ${sizes.padding}px;
            background-color: #007acc;
            color: white;
            font-size: ${sizes.fontSize}px;
            font-weight: 500;
            user-select: none;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            overflow: hidden;
            transition: height 0.15s ease, opacity 0.15s ease;
            opacity: ${isCollapsed ? 0 : 1};
          }
          
          .shuang-header-title {
            display: flex;
            align-items: center;
          }
          
          .shuang-content {
            flex: 1;
            overflow: auto;
            padding: ${Math.max(1, Math.floor(sizes.padding / 2))}px ${sizes.padding}px;
            padding-bottom: ${sizes.dragHandleHeight + Math.max(1, Math.floor(sizes.padding / 2))}px;
            font-size: calc(1em * ${scale});
            color: #333;
            min-height: 0;
            display: ${isCollapsed ? 'none' : 'block'};
          }
          
          .shuang-drag-handle {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: ${sizes.dragHandleHeight}px;
            background-color: #007acc;
            cursor: row-resize;
            flex-shrink: 0;
            transition: background-color 0.2s, height 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            touch-action: none;
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
          
          .shuang-message-wrapper {
            position: relative;
          }
          
          .shuang-message-wrapper:hover .shuang-locate-btn {
            opacity: 1;
          }
          
          .shuang-locate-btn {
            position: absolute;
            right: 2px;
            top: 2px;
            width: 20px;
            height: 20px;
            background-color: rgba(0, 122, 204, 0.9);
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.15s ease;
            z-index: 5;
          }
          
          .shuang-locate-btn:hover {
            background-color: #005a9e;
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
            setTimeout(() => {
              scrollToBottom();
              log('SHUANG_CHAT_BOX', '霜语文本框重新显示，滚动到底部');
            }, 100);
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

  const scrollToOriginalMessage = useCallback((originalElement: HTMLElement) => {
    const textAreaElement = document.getElementById('TextAreaChatLog');
    if (!textAreaElement || !originalElement) return;
    
    originalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    originalElement.style.transition = 'background-color 0.3s';
    originalElement.style.backgroundColor = 'rgba(0, 122, 204, 0.3)';
    setTimeout(() => {
      originalElement.style.backgroundColor = '';
    }, 1500);
  }, []);

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
        
        const template = document.createElement('template');
        template.innerHTML = msg.originalElement.outerHTML.trim();
        const clonedElement = template.content.firstChild as HTMLElement;
        
        if (clonedElement) {
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
          
          clonedElement.querySelectorAll('.chat-room-sep-collapse').forEach((clonedBtn) => {
            const originalBtn = msg.originalElement.querySelector('.chat-room-sep-collapse');
            if (originalBtn) {
              clonedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                (originalBtn as HTMLElement).click();
              });
            }
          });
          
          clonedElement.querySelectorAll('.chat-room-sep-header').forEach((clonedBtn) => {
            const originalBtn = msg.originalElement.querySelector('.chat-room-sep-header');
            if (originalBtn) {
              clonedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                (originalBtn as HTMLElement).click();
              });
            }
          });
          
          wrapper.appendChild(clonedElement);
        }
        
        const locateBtn = document.createElement('button');
        locateBtn.className = 'shuang-locate-btn';
        locateBtn.innerHTML = '⬆';
        locateBtn.title = '定位到游戏聊天框';
        locateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          scrollToOriginalMessage(msg.originalElement);
        });
        wrapper.appendChild(locateBtn);
        
        contentRef.current!.appendChild(wrapper);
      });
    }
  }, [messages, scrollToOriginalMessage]);

  useEffect(() => {
    if (chatBoxEnabled) {
      renderMessages();
    }
  }, [chatBoxEnabled, renderMessages]);

  useEffect(() => {
    if (contentRef.current && messages.length > 0) {
      if (isAtBottomRef.current) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      isAtBottomRef.current = checkIfAtBottom();
    };

    content.addEventListener('scroll', handleScroll);
    return () => {
      content.removeEventListener('scroll', handleScroll);
    };
  }, [checkIfAtBottom]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const content = contentRef.current;
      if (!content) return;
      
      const containerHeight = content.clientHeight;
      const scrollAmount = Math.max(20, containerHeight * 0.1);
      
      const delta = e.deltaY > 0 ? scrollAmount : -scrollAmount;
      content.scrollTop += delta;
    };

    const content = contentRef.current;
    if (!content) {
      const interval = setInterval(() => {
        const contentEl = contentRef.current;
        if (contentEl) {
          clearInterval(interval);
          contentEl.addEventListener('wheel', handleWheel, { passive: false });
        }
      }, 100);
      return () => clearInterval(interval);
    }
    
    content.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      content.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getPositionFromEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number => {
    if ('touches' in e) {
      const touches = 'nativeEvent' in e ? e.nativeEvent.touches : e.touches;
      if (touches && touches.length > 0) {
        return touches[0].clientY;
      }
    }
    if ('clientY' in e) {
      return e.clientY;
    }
    return 0;
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const gameChatBoxElement = document.getElementById('chat-room-div');
      if (!gameChatBoxElement) return;

      const clientY = getPositionFromEvent(e);
      const gameRect = gameChatBoxElement.getBoundingClientRect();
      const deltaY = clientY - dragStartYRef.current;
      const deltaRatio = deltaY / gameRect.height;
      const newRatio = Math.max(MIN_HEIGHT_RATIO, Math.min(MAX_HEIGHT_RATIO, dragStartRatioRef.current + deltaRatio));

      setHeightRatio(newRatio);
      
      if (isAtBottomRef.current) {
        scrollToBottom();
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, scrollToBottom]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = getPositionFromEvent(e);
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
      </div>
      <div className="shuang-content" ref={contentRef}></div>
      <div 
        className={`shuang-drag-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        title="拖拽调整高度"
      />
    </>,
    portalContainer
  );
};
