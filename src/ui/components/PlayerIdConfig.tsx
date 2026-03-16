import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  useShuangConfigStore, 
  MessageTypeFilter, 
  ALL_MESSAGE_TYPES, 
  FollowedPlayer
} from '../../store/useShuangConfigStore';
import { useScale } from '../context/ScaleContext';

interface PlayerIdConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerIdConfig: React.FC<PlayerIdConfigProps> = ({ isOpen, onClose }) => {
  const { 
    followedPlayers, 
    addFollowedPlayer, 
    removeFollowedPlayer,
    togglePlayerMessageType,
    setPlayerMessageTypes,
    togglePlayerContentMatch,
    globalKeywords,
    setGlobalKeywords
  } = useShuangConfigStore();
  
  const [newPlayerId, setNewPlayerId] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState('');
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragOffset({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!isOpen) return null;

  const handleAddPlayerId = () => {
    const trimmedId = newPlayerId.trim();
    if (trimmedId && !followedPlayers.some(p => p.id === trimmedId)) {
      addFollowedPlayer(trimmedId);
      setNewPlayerId('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayerId();
    }
  };

  const handleToggleAllTypes = (playerId: string, currentTypes: MessageTypeFilter[], currentContentMatch: boolean) => {
    const isAllSelected = currentTypes.length === ALL_MESSAGE_TYPES.length && currentContentMatch;
    if (isAllSelected) {
      setPlayerMessageTypes(playerId, []);
      const player = followedPlayers.find(p => p.id === playerId);
      if (player?.contentMatch) {
        togglePlayerContentMatch(playerId);
      }
    } else {
      setPlayerMessageTypes(playerId, [...ALL_MESSAGE_TYPES]);
      if (!currentContentMatch) {
        togglePlayerContentMatch(playerId);
      }
    }
  };

  const handleStartEditKeywords = () => {
    setKeywordsInput(globalKeywords.join(', '));
    setIsEditingKeywords(true);
  };

  const handleSaveKeywords = () => {
    const keywords = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    setGlobalKeywords(keywords);
    setIsEditingKeywords(false);
    setKeywordsInput('');
  };

  const handleCancelEditKeywords = () => {
    setIsEditingKeywords(false);
    setKeywordsInput('');
  };

  const renderToggleButton = (
    isEnabled: boolean, 
    onClick: () => void, 
    size: 'small' | 'normal' = 'small'
  ) => (
    <button
      onClick={onClick}
      style={{
        width: size === 'small' ? `${28 * scale}px` : `${36 * scale}px`,
        height: size === 'small' ? `${22 * scale}px` : `${26 * scale}px`,
        padding: 0,
        backgroundColor: isEnabled ? '#28a745' : '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: `${4 * scale}px`,
        cursor: 'pointer',
        fontSize: `${10 * scale}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease'
      }}
    >
      {isEnabled ? '✓' : '✗'}
    </button>
  );

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10002,
        cursor: isDragging ? 'grabbing' : 'default',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: `${12 * scale}px`,
          padding: 0,
          width: `${580 * scale}px`,
          maxWidth: '95vw',
          maxHeight: '75vh',
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
            touchAction: 'none'
          }}
        >
          <h2 style={{ margin: 0, fontSize: `${15 * scale}px`, color: '#333', fontWeight: 600 }}>
            特别关注配置
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
        
        <div style={{ padding: `${12 * scale}px ${16 * scale}px`, borderBottom: `${1 * scale}px solid #eee` }}>
          <div style={{ display: 'flex', gap: `${8 * scale}px`, marginBottom: `${10 * scale}px` }}>
            <input
              type="text"
              value={newPlayerId}
              onChange={(e) => setNewPlayerId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入玩家ID后回车添加"
              style={{
                flex: 1,
                padding: `${6 * scale}px ${10 * scale}px`,
                border: `${1 * scale}px solid #ddd`,
                borderRadius: `${4 * scale}px`,
                fontSize: `${12 * scale}px`,
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddPlayerId}
              style={{
                padding: `${6 * scale}px ${14 * scale}px`,
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: `${4 * scale}px`,
                cursor: 'pointer',
                fontSize: `${12 * scale}px`
              }}
            >
              添加
            </button>
          </div>
          
          <div style={{ 
            padding: `${8 * scale}px ${10 * scale}px`, 
            backgroundColor: '#f5f5f5', 
            borderRadius: `${4 * scale}px`,
            fontSize: `${11 * scale}px`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: '#666', fontWeight: 500 }}>全局关键字：</span>
                {isEditingKeywords ? (
                  <input
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveKeywords();
                      if (e.key === 'Escape') handleCancelEditKeywords();
                    }}
                    placeholder="用逗号分隔多个关键字"
                    style={{
                      padding: `${4 * scale}px ${8 * scale}px`,
                      border: `${1 * scale}px solid #ddd`,
                      borderRadius: `${4 * scale}px`,
                      fontSize: `${11 * scale}px`,
                      outline: 'none',
                      width: `${200 * scale}px`
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    style={{ color: '#007acc', cursor: 'pointer' }}
                    onClick={handleStartEditKeywords}
                    title="点击编辑"
                  >
                    {globalKeywords.length > 0 
                      ? globalKeywords.join(', ') 
                      : <span style={{ color: '#999' }}>点击添加关键字</span>}
                  </span>
                )}
              </div>
              {isEditingKeywords ? (
                <div style={{ display: 'flex', gap: `${6 * scale}px` }}>
                  <button
                    onClick={handleSaveKeywords}
                    style={{
                      padding: `${3 * scale}px ${10 * scale}px`,
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: `${4 * scale}px`,
                      cursor: 'pointer',
                      fontSize: `${11 * scale}px`
                    }}
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancelEditKeywords}
                    style={{
                      padding: `${3 * scale}px ${10 * scale}px`,
                      backgroundColor: '#e0e0e0',
                      color: '#666',
                      border: 'none',
                      borderRadius: `${4 * scale}px`,
                      cursor: 'pointer',
                      fontSize: `${11 * scale}px`
                    }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEditKeywords}
                  style={{
                    padding: `${3 * scale}px ${10 * scale}px`,
                    backgroundColor: '#007acc',
                    color: 'white',
                    border: 'none',
                    borderRadius: `${4 * scale}px`,
                    cursor: 'pointer',
                    fontSize: `${11 * scale}px`
                  }}
                >
                  编辑
                </button>
              )}
            </div>
            <div style={{ color: '#999', marginTop: `${4 * scale}px` }}>
              匹配消息中包含这些关键字的内容（与玩家内容匹配独立）
            </div>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          overflow: 'auto'
        }}>
          {followedPlayers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#999', 
              padding: `${40 * scale}px ${20 * scale}px`, 
              fontSize: `${13 * scale}px`
            }}>
              暂无关注的玩家
            </div>
          ) : (
            <table style={{ 
              width: '100%', 
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontSize: `${12 * scale}px`
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f5f5',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <th style={{ padding: `${8 * scale}px ${10 * scale}px`, textAlign: 'left', fontWeight: 500, color: '#666', width: `${70 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }}>玩家ID</th>
                  <th style={{ padding: `${8 * scale}px ${10 * scale}px`, textAlign: 'left', fontWeight: 500, color: '#666', width: `${70 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }}>名称</th>
                  <th style={{ padding: `${8 * scale}px ${4 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${36 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }} title="对话消息">对话</th>
                  <th style={{ padding: `${8 * scale}px ${4 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${36 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }} title="Emote">Emote</th>
                  <th style={{ padding: `${8 * scale}px ${4 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${36 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }} title="动作">动作</th>
                  <th style={{ padding: `${8 * scale}px ${4 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${36 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }} title="其他">其他</th>
                  <th style={{ padding: `${8 * scale}px ${4 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${36 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }} title="内容匹配">匹配</th>
                  <th style={{ padding: `${8 * scale}px ${4 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${36 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }} title="全选">全选</th>
                  <th style={{ padding: `${8 * scale}px ${10 * scale}px`, textAlign: 'center', fontWeight: 500, color: '#666', width: `${40 * scale}px`, borderBottom: `${1 * scale}px solid #e0e0e0` }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {followedPlayers.map((player: FollowedPlayer) => (
                  <tr key={player.id} style={{ backgroundColor: '#fff' }}>
                    <td style={{ padding: `${6 * scale}px ${10 * scale}px`, fontWeight: 500, color: '#333', borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                      {player.id}
                    </td>
                    <td style={{ padding: `${6 * scale}px ${10 * scale}px`, color: '#666', borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                      {player.name || '-'}
                    </td>
                    {ALL_MESSAGE_TYPES.map((type) => (
                      <td key={type} style={{ padding: `${6 * scale}px ${4 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {renderToggleButton(
                            player.messageTypes.includes(type),
                            () => togglePlayerMessageType(player.id, type)
                          )}
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: `${6 * scale}px ${4 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderToggleButton(
                          player.contentMatch,
                          () => togglePlayerContentMatch(player.id)
                        )}
                      </div>
                    </td>
                    <td style={{ padding: `${6 * scale}px ${4 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderToggleButton(
                          player.messageTypes.length === ALL_MESSAGE_TYPES.length && player.contentMatch,
                          () => handleToggleAllTypes(player.id, player.messageTypes, player.contentMatch),
                          'normal'
                        )}
                      </div>
                    </td>
                    <td style={{ padding: `${6 * scale}px ${10 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={() => removeFollowedPlayer(player.id)}
                          style={{
                            padding: `${4 * scale}px ${8 * scale}px`,
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: `${4 * scale}px`,
                            cursor: 'pointer',
                            fontSize: `${11 * scale}px`
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div style={{ 
          padding: `${8 * scale}px ${16 * scale}px`, 
          borderTop: `${1 * scale}px solid #eee`,
          backgroundColor: '#f9f9f9',
          fontSize: `${11 * scale}px`,
          color: '#999'
        }}>
          <span>✓ = 开启</span>
          <span style={{ margin: `0 ${8 * scale}px` }}>|</span>
          <span>✗ = 关闭</span>
          <span style={{ margin: `0 ${8 * scale}px` }}>|</span>
          <span>匹配 = 内容匹配（匹配玩家名字/昵称）</span>
          <span style={{ margin: `0 ${8 * scale}px` }}>|</span>
          <span>全局关键字独立匹配</span>
        </div>
      </div>
    </div>
  );
};
