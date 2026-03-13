import React, { useState } from 'react';
import { useShuangConfigStore } from '../../store/useShuangConfigStore';

interface PlayerIdConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerIdConfig: React.FC<PlayerIdConfigProps> = ({ isOpen, onClose }) => {
  const { followedPlayerIds, addFollowedPlayerId, removeFollowedPlayerId } = useShuangConfigStore();
  const [newPlayerId, setNewPlayerId] = useState('');

  if (!isOpen) return null;

  const handleAddPlayerId = () => {
    const trimmedId = newPlayerId.trim();
    if (trimmedId && !followedPlayerIds.includes(trimmedId)) {
      addFollowedPlayerId(trimmedId);
      setNewPlayerId('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayerId();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10002
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
          特别关注玩家配置
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newPlayerId}
              onChange={(e) => setNewPlayerId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入玩家ID"
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddPlayerId}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              添加
            </button>
          </div>
          
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            提示：玩家ID可以在聊天框中右键点击玩家名字查看
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#666' }}>
            已关注的玩家 ({followedPlayerIds.length})
          </div>
          
          {followedPlayerIds.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: '14px' }}>
              暂无关注的玩家
            </div>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {followedPlayerIds.map((playerId: string) => (
                <div
                  key={playerId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#333' }}>{playerId}</span>
                  <button
                    onClick={() => removeFollowedPlayerId(playerId)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
