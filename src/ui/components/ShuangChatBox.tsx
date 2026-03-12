import React, { useEffect, useState, useRef } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';
import { createPortal } from 'react-dom';

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const isAppliedRef = useRef(false);

  useEffect(() => {
    console.log('[ShuangDialog] 霜语文本框开关状态:', chatBoxEnabled);

    const gameChatBoxElement = document.getElementById('chat-room-div');
    const textAreaElement = document.getElementById('TextAreaChatLog');

    if (!gameChatBoxElement || !textAreaElement) {
      console.warn('[ShuangDialog] 未找到游戏文本框元素');
      return;
    }

    if (chatBoxEnabled) {
      if (isAppliedRef.current) {
        console.log('[ShuangDialog] 已经应用，跳过');
        return;
      }

      console.log('[ShuangDialog] 开启霜语文本框');

      if (styleElementRef.current) {
        styleElementRef.current.remove();
      }

      const styleEl = document.createElement('style');
      styleEl.id = 'shuang-chat-box-style';
      styleEl.textContent = `
        #chat-room-div {
          display: flex !important;
          flex-direction: column !important;
        }
        #TextAreaChatLog {
          height: 66.67% !important;
          flex-shrink: 0 !important;
          order: 2 !important;
        }
        .shuang-chat-box-container {
          height: 33.33%;
          min-height: 80px;
          background-color: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid #ccc;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
          order: 1 !important;
        }
        .shuang-chat-box-header {
          padding: 8px 12px;
          background-color: #007acc;
          color: white;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 1px solid #005a9e;
          flex-shrink: 0;
        }
        .shuang-chat-box-content {
          flex: 1;
          overflow: auto;
          padding: 8px;
          font-size: 14px;
          color: #333;
        }
      `;
      document.head.appendChild(styleEl);
      styleElementRef.current = styleEl;

      const container = document.createElement('div');
      container.id = 'shuang-chat-box-portal';
      gameChatBoxElement.appendChild(container);
      setPortalContainer(container);
      isAppliedRef.current = true;

      console.log('[ShuangDialog] 已注入样式和容器');

    } else {
      if (isAppliedRef.current) {
        console.log('[ShuangDialog] 关闭霜语文本框');

        if (styleElementRef.current) {
          styleElementRef.current.remove();
          styleElementRef.current = null;
        }

        const existingContainer = document.getElementById('shuang-chat-box-portal');
        if (existingContainer) {
          existingContainer.remove();
        }

        isAppliedRef.current = false;
      }

      setPortalContainer(null);
    }

    return () => {
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
      const existingContainer = document.getElementById('shuang-chat-box-portal');
      if (existingContainer) {
        existingContainer.remove();
      }
      isAppliedRef.current = false;
    };
  }, [chatBoxEnabled]);

  if (!chatBoxEnabled || !portalContainer) {
    return null;
  }

  return createPortal(
    <div className="shuang-chat-box-container">
      <div className="shuang-chat-box-header">霜语文本框</div>
      <div className="shuang-chat-box-content">
        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
          内容区域（待实现）
        </div>
      </div>
    </div>,
    portalContainer
  );
};
