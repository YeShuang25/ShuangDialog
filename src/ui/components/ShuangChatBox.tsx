import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';
import { useShuangMessagesStore } from '../../store/useShuangMessagesStore';
import { useShuangConfigStore } from '../../store/useShuangConfigStore';
import { createPortal } from 'react-dom';
import { log } from '../../config/debug';
import { messageFilter } from '../../utils/messageFilter';

const MIN_HEIGHT_RATIO = 0.1;
const MAX_HEIGHT_RATIO = 0.9;
const DEFAULT_HEIGHT_RATIO = 0.33;

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const messages = useShuangMessagesStore((state) => state.messages);
  const { fontScale, setFontScale } = useShuangConfigStore();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [heightRatio, setHeightRatio] = useState(DEFAULT_HEIGHT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const [localFontScale, setLocalFontScale] = useState(fontScale.toString());
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const isInitializedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartRatioRef = useRef(DEFAULT_HEIGHT_RATIO);
  const originalHeightRef = useRef<string>('');
  const domWatcherRef = useRef<MutationObserver | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const messageFilterStartedRef = useRef(false);

  const updateStyles = useCallback((ratio: number, enabled: boolean, scale: number) => {
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
            font-size: 0.7em;
            font-weight: 500;
            user-select: none;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .shuang-header-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .shuang-header-controls {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .shuang-font-scale-label {
            font-size: 0.9em;
            opacity: 0.9;
          }
          
          .shuang-font-scale-input {
            width: 45px;
            padding: 2px 4px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 0.9em;
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
            padding: 4px;
            font-size: calc(1em * ${scale});
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
            font-size: 0.9em;
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
            height: ${originalHeightRef.current} !important;
            min-height: 0 !important;
            max-height: none !important;
          }
        `;
      }
    }
  }, []);

  const getOriginalHeight = useCallback((textAreaElement: HTMLElement): string => {
    const inlineHeight = textAreaElement.style.height;
    if (inlineHeight && inlineHeight !== 'auto') {
      const calcMatch = inlineHeight.match(/calc\(([\d.]+)px\)/);
      if (calcMatch) {
        const heightValue = `${calcMatch[1]}px`;
        log('SHUANG_CHAT_BOX', '使用内联calc高度:', heightValue);
        return heightValue;
      }
      if (!inlineHeight.includes('calc(')) {
        log('SHUANG_CHAT_BOX', '使用内联高度:', inlineHeight);
        return inlineHeight;
      }
    }
    
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (gameChatBoxElement) {
      const gameChatBoxHeight = gameChatBoxElement.getBoundingClientRect().height;
      const chatRoomBot = document.getElementById('chat-room-bot');
      const botHeight = chatRoomBot ? chatRoomBot.getBoundingClientRect().height : 50;
      const calculatedHeight = gameChatBoxHeight - botHeight;
      const heightValue = `${calculatedHeight}px`;
      log('SHUANG_CHAT_BOX', '计算高度:', heightValue, '(游戏框:', gameChatBoxHeight, '- 输入框:', botHeight, ')');
      return heightValue;
    }
    
    const computedStyle = window.getComputedStyle(textAreaElement);
    const computedHeight = computedStyle.height;
    log('SHUANG_CHAT_BOX', '使用计算高度:', computedHeight);
    return computedHeight;
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

    const originalHeight = getOriginalHeight(textAreaElement);
    originalHeightRef.current = originalHeight;
    log('SHUANG_CHAT_BOX', '保存游戏文本框原始高度:', originalHeight);

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

    updateStyles(heightRatio, chatBoxEnabled, fontScale);

    log('SHUANG_CHAT_BOX', '已初始化霜语组件');
    return true;
  }, [chatBoxEnabled, heightRatio, fontScale, updateStyles, getOriginalHeight]);

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
          updateStyles(heightRatio, true, fontScale);
          startMessageFilter();
        } else {
          portalEl.setAttribute('hidden', '');
          updateStyles(heightRatio, false, fontScale);
          stopMessageFilter();
          
          const textAreaElement = document.getElementById('TextAreaChatLog');
          if (textAreaElement && originalHeightRef.current) {
            textAreaElement.style.height = originalHeightRef.current;
            log('SHUANG_CHAT_BOX', '恢复游戏文本框高度:', originalHeightRef.current);
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
  }, [chatBoxEnabled, fontScale]);

  useEffect(() => {
    if (isInitializedRef.current && chatBoxEnabled && styleElementRef.current) {
      const cssText = styleElementRef.current.textContent;
      const updatedCss = cssText
        .replace(
          /#shuang-chat-box-portal \{[^}]*flex: [\d.]+;/,
          `#shuang-chat-box-portal {\n            display: flex;\n            flex-direction: column;\n            flex: ${heightRatio};`
        )
        .replace(
          /#TextAreaChatLog \{[^}]*flex: [\d.]+ !important;/,
          `#TextAreaChatLog {\n            flex: ${1 - heightRatio} !important;`
        );
      styleElementRef.current.textContent = updatedCss;
    }
  }, [heightRatio, chatBoxEnabled]);

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
