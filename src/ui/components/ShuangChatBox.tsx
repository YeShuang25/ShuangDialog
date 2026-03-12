import React, { useEffect, useState, useCallback } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';

interface ChatBoxPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const [gameChatBox, setGameChatBox] = useState<ChatBoxPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updatePosition = useCallback(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (gameChatBoxElement) {
      const rect = gameChatBoxElement.getBoundingClientRect();
      setGameChatBox({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    
    if (!gameChatBoxElement) return;

    if (chatBoxEnabled) {
      updatePosition();

      const observer = new MutationObserver(() => {
        updatePosition();
      });

      observer.observe(gameChatBoxElement, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      const resizeObserver = new ResizeObserver(() => {
        updatePosition();
      });

      resizeObserver.observe(gameChatBoxElement);

      window.addEventListener('resize', updatePosition);

      return () => {
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setGameChatBox(null);
      setIsVisible(false);
    }
  }, [chatBoxEnabled, updatePosition]);

  useEffect(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (!gameChatBoxElement) return;

    if (chatBoxEnabled && gameChatBox) {
      const shuangChatBoxHeight = gameChatBox.height / 3;
      const adjustedGameChatBoxTop = gameChatBox.top + shuangChatBoxHeight;
      const adjustedGameChatBoxHeight = gameChatBox.height - shuangChatBoxHeight;

      gameChatBoxElement.style.position = 'fixed';
      gameChatBoxElement.style.left = `${gameChatBox.left}px`;
      gameChatBoxElement.style.top = `${adjustedGameChatBoxTop}px`;
      gameChatBoxElement.style.height = `${adjustedGameChatBoxHeight}px`;
    } else {
      gameChatBoxElement.style.position = '';
      gameChatBoxElement.style.left = '';
      gameChatBoxElement.style.top = '';
      gameChatBoxElement.style.height = '';
    }

    return () => {
      if (gameChatBoxElement) {
        gameChatBoxElement.style.position = '';
        gameChatBoxElement.style.left = '';
        gameChatBoxElement.style.top = '';
        gameChatBoxElement.style.height = '';
      }
    };
  }, [chatBoxEnabled, gameChatBox]);

  if (!chatBoxEnabled || !gameChatBox || !isVisible) {
    return null;
  }

  const shuangChatBoxHeight = gameChatBox.height / 3;

  return (
    <div
      style={{
        position: 'fixed',
        left: gameChatBox.left,
        top: gameChatBox.top,
        width: gameChatBox.width,
        height: shuangChatBoxHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 9998,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#007acc',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500,
          borderBottom: '1px solid #005a9e'
        }}
      >
        霜语文本框
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          fontSize: '14px',
          color: '#333'
        }}
      >
        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
          内容区域（待实现）
        </div>
      </div>
    </div>
  );
};
