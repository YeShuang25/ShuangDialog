import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  useShuangConfigStore, 
  MessageTypeFilter, 
  ALL_MESSAGE_TYPES, 
  FollowedPlayer
} from '../../store/useShuangConfigStore';

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
    togglePlayerContentMatch
  } = useShuangConfigStore();
  
  const [newPlayerId, setNewPlayerId] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  const renderToggleButton = (
    isEnabled: boolean, 
    onClick: () => void, 
    size: 'small' | 'normal' = 'small'
  ) => (
    <button
      onClick={onClick}
      style={{
        width: size === 'small' ? '28px' : '36px',
        height: size === 'small' ? '22px' : '26px',
        padding: 0,
        backgroundColor: isEnabled ? '#28a745' : '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '10px',
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
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: 0,
          width: '560px',
          maxWidth: '95vw',
          maxHeight: '75vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid #ddd'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-header"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'grab',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px 12px 0 0',
            userSelect: 'none'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '15px', color: '#333', fontWeight: 600 }}>
            特别关注配置
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              backgroundColor: '#e0e0e0',
              color: '#666',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            关闭
          </button>
        </div>
        
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newPlayerId}
              onChange={(e) => setNewPlayerId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入玩家ID后回车添加"
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddPlayerId}
              style={{
                padding: '6px 14px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              添加
            </button>
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
              padding: '40px 20px', 
              fontSize: '13px'
            }}>
              暂无关注的玩家
            </div>
          ) : (
            <table style={{ 
              width: '100%', 
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f5f5',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#666', width: '70px', borderBottom: '1px solid #e0e0e0' }}>玩家ID</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#666', width: '80px', borderBottom: '1px solid #e0e0e0' }}>名称</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, color: '#666', width: '40px', borderBottom: '1px solid #e0e0e0' }} title="对话消息">对话</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, color: '#666', width: '40px', borderBottom: '1px solid #e0e0e0' }} title="Emote">Emote</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, color: '#666', width: '40px', borderBottom: '1px solid #e0e0e0' }} title="动作">动作</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, color: '#666', width: '40px', borderBottom: '1px solid #e0e0e0' }} title="其他">其他</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, color: '#666', width: '50px', borderBottom: '1px solid #e0e0e0' }} title="内容匹配">匹配</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500, color: '#666', width: '40px', borderBottom: '1px solid #e0e0e0' }} title="全选">全选</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#666', width: '40px', borderBottom: '1px solid #e0e0e0' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {followedPlayers.map((player: FollowedPlayer) => (
                  <tr 
                    key={player.id}
                    style={{ 
                      backgroundColor: '#fff'
                    }}
                  >
                    <td style={{ padding: '6px 10px', fontWeight: 500, color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                      {player.id}
                    </td>
                    <td style={{ padding: '6px 10px', color: '#666', borderBottom: '1px solid #f0f0f0' }}>
                      {player.name || '-'}
                    </td>
                    {ALL_MESSAGE_TYPES.map((type) => (
                      <td key={type} style={{ padding: '6px 4px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {renderToggleButton(
                            player.messageTypes.includes(type),
                            () => togglePlayerMessageType(player.id, type)
                          )}
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderToggleButton(
                          player.contentMatch,
                          () => togglePlayerContentMatch(player.id)
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderToggleButton(
                          player.messageTypes.length === ALL_MESSAGE_TYPES.length && player.contentMatch,
                          () => handleToggleAllTypes(player.id, player.messageTypes, player.contentMatch),
                          'normal'
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={() => removeFollowedPlayer(player.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
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
          padding: '8px 16px', 
          borderTop: '1px solid #eee',
          backgroundColor: '#f9f9f9',
          fontSize: '11px',
          color: '#999'
        }}>
          <span>✓ = 开启</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>✗ = 关闭</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>匹配 = 内容匹配（匹配消息中提及的该玩家名字/昵称）</span>
        </div>
      </div>
    </div>
  );
};
