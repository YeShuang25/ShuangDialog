import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  useShuangConfigStore, 
  MessageTypeFilter, 
  ALL_MESSAGE_TYPES, 
  FollowedPlayer,
  getMessageTypeLabel 
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
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
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

  const togglePlayerExpand = (playerId: string) => {
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  };

  const handleToggleAllTypes = (playerId: string, currentTypes: MessageTypeFilter[]) => {
    if (currentTypes.length === ALL_MESSAGE_TYPES.length) {
      setPlayerMessageTypes(playerId, []);
    } else {
      setPlayerMessageTypes(playerId, [...ALL_MESSAGE_TYPES]);
    }
  };

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
          padding: '0',
          width: '420px',
          maxWidth: '90vw',
          maxHeight: '70vh',
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
            padding: '16px 20px',
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
          <h2 style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: 600 }}>
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
        
        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newPlayerId}
                onChange={(e) => setNewPlayerId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入玩家ID"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAddPlayerId}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007acc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                添加
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              提示：玩家ID可以在聊天框中右键点击玩家名字查看
            </div>
          </div>

          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            maxHeight: 'calc(70vh - 180px)'
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 500, 
              marginBottom: '10px', 
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>已关注的玩家</span>
              <span style={{ 
                backgroundColor: '#e0e0e0', 
                padding: '2px 8px', 
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {followedPlayers.length}
              </span>
            </div>
            
            {followedPlayers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '30px 20px', 
                fontSize: '13px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px'
              }}>
                暂无关注的玩家
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {followedPlayers.map((player: FollowedPlayer) => {
                  const isExpanded = expandedPlayerId === player.id;
                  const enabledCount = player.messageTypes.length;
                  
                  return (
                    <div
                      key={player.id}
                      style={{
                        backgroundColor: '#f9f9f9',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #eee'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => togglePlayerExpand(player.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '9px',
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                          }}>
                            ▶
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                            {player.name || player.id}
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#007acc',
                            backgroundColor: '#e3f2fd',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {enabledCount}/{ALL_MESSAGE_TYPES.length}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFollowedPlayer(player.id);
                          }}
                          style={{
                            padding: '3px 8px',
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
                      
                      {isExpanded && (
                        <div style={{ 
                          padding: '10px 12px 12px 28px',
                          borderTop: '1px solid #eee',
                          backgroundColor: '#fff'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                          }}>
                            <span style={{ fontSize: '11px', color: '#666' }}>监听消息类型</span>
                            <button
                              onClick={() => handleToggleAllTypes(player.id, player.messageTypes)}
                              style={{
                                padding: '2px 8px',
                                backgroundColor: enabledCount === ALL_MESSAGE_TYPES.length ? '#e0e0e0' : '#007acc',
                                color: enabledCount === ALL_MESSAGE_TYPES.length ? '#666' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              {enabledCount === ALL_MESSAGE_TYPES.length ? '取消全选' : '全选'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {ALL_MESSAGE_TYPES.map((type) => {
                              const isEnabled = player.messageTypes.includes(type);
                              return (
                                <button
                                  key={type}
                                  onClick={() => togglePlayerMessageType(player.id, type)}
                                  style={{
                                    padding: '4px 10px',
                                    backgroundColor: isEnabled ? '#007acc' : '#e0e0e0',
                                    color: isEnabled ? 'white' : '#666',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {getMessageTypeLabel(type)}
                                </button>
                              );
                            })}
                          </div>
                          
                          <div style={{ 
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #ddd'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between'
                            }}>
                              <div>
                                <span style={{ fontSize: '11px', color: '#666' }}>内容匹配</span>
                                <span style={{ 
                                  fontSize: '10px', 
                                  color: '#999',
                                  marginLeft: '6px'
                                }}>
                                  (匹配消息中提及的该玩家名字/昵称)
                                </span>
                              </div>
                              <button
                                onClick={() => togglePlayerContentMatch(player.id)}
                                style={{
                                  padding: '3px 10px',
                                  backgroundColor: player.contentMatch ? '#28a745' : '#e0e0e0',
                                  color: player.contentMatch ? 'white' : '#666',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px'
                                }}
                              >
                                {player.contentMatch ? '已开启' : '已关闭'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
