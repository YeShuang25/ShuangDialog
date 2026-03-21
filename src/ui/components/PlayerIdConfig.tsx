import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  useShuangConfigStore, 
  MessageTypeFilter, 
  ALL_MESSAGE_TYPES, 
  FollowedPlayer,
  MessageFilterStatus
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
    setPlayerMessageTypeStatus,
    togglePlayerContentMatch,
    globalKeywords,
    setGlobalKeywords
  } = useShuangConfigStore();
  
  const [newPlayerId, setNewPlayerId] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 580, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);
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

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
    setResizeStartSize(size);
  }, [size]);

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
    if (isResizing) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;
      const newWidth = Math.max(400, resizeStartSize.width + deltaX / scale);
      const newHeight = Math.max(300, resizeStartSize.height + deltaY / scale);
      setSize({
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, dragOffset, scale, resizeStartSize]);

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
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

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

  const handleToggleAllTypes = (playerId: string, player: FollowedPlayer) => {
    const isAllSelected = player.messageTypes.length === ALL_MESSAGE_TYPES.length && 
                          (player.excludedMessageTypes || []).length === 0 &&
                          player.contentMatch;
    
    if (isAllSelected) {
      ALL_MESSAGE_TYPES.forEach(type => {
        setPlayerMessageTypeStatus(playerId, type, 'disabled');
      });
      if (player.contentMatch) togglePlayerContentMatch(playerId);
    } else {
      ALL_MESSAGE_TYPES.forEach(type => {
        setPlayerMessageTypeStatus(playerId, type, 'enabled');
      });
      if (!player.contentMatch) togglePlayerContentMatch(playerId);
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

  const getMessageTypeStatus = (player: FollowedPlayer, type: MessageTypeFilter): MessageFilterStatus => {
    if ((player.excludedMessageTypes || []).includes(type)) {
      return 'excluded';
    }
    if (player.messageTypes.includes(type)) {
      return 'enabled';
    }
    return 'disabled';
  };

  const renderThreeStateButton = (
    status: MessageFilterStatus,
    onClick: () => void,
    size: 'small' | 'normal' = 'small'
  ) => {
    const colors = {
      enabled: { bg: '#28a745', text: '✓' },
      excluded: { bg: '#fd7e14', text: '⊘' },
      disabled: { bg: '#dc3545', text: '✗' }
    };
    
    return (
      <button
        onClick={onClick}
        style={{
          width: size === 'small' ? `${28 * scale}px` : `${36 * scale}px`,
          height: size === 'small' ? `${22 * scale}px` : `${26 * scale}px`,
          padding: 0,
          backgroundColor: colors[status].bg,
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
        {colors[status].text}
      </button>
    );
  };

  const renderTwoStateButton = (
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
        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'default',
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
          width: `${size.width * scale}px`,
          height: `${size.height * scale}px`,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: `${1 * scale}px solid #ddd`,
          position: 'relative'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
            <h2 style={{ margin: 0, fontSize: `${15 * scale}px`, color: '#333', fontWeight: 600 }}>
              {showHelp ? '帮助说明' : '特别关注配置'}
            </h2>
            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{
                width: `${18 * scale}px`,
                height: `${18 * scale}px`,
                padding: 0,
                backgroundColor: showHelp ? '#007acc' : '#e0e0e0',
                color: showHelp ? 'white' : '#666',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: `${11 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
              title={showHelp ? '返回配置' : '查看帮助'}
            >
              ?
            </button>
          </div>
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
        
        {showHelp ? (
          <div style={{
            padding: `${12 * scale}px ${16 * scale}px`,
            backgroundColor: '#f0f7ff',
            fontSize: `${11 * scale}px`,
            lineHeight: 1.6,
            maxHeight: `${350 * scale}px`,
            overflowY: 'auto'
          }}>
            <div 
              onClick={() => setShowRecommend(!showRecommend)}
              style={{ 
                color: '#155724', 
                backgroundColor: showRecommend ? '#d4edda' : '#e8f5e9', 
                padding: `${8 * scale}px ${12 * scale}px`, 
                borderRadius: `${4 * scale}px`,
                marginBottom: `${10 * scale}px`,
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              💡 <strong>推荐设置</strong> {showRecommend ? '▼' : '▶'}
              {showRecommend && (
                <>
                  <br/><br/>
                  为了筛选出所有与自己有关的消息，建议：<br/><br/>
                  <strong>1. 关注自己：</strong><br/>
                  • 添加自己的玩家ID到关注列表<br/>
                  • 排除自己的对话、Emote、动作和其他<br/>
                  • 打开自己的"匹配"选项<br/><br/>
                  <strong>2. 设置全局关键字：</strong><br/>
                  • 填上他人经常叫你的外号或别名<br/><br/>
                  <strong>3. 关注其他玩家：</strong><br/>
                  • 勾选上所有分类即可<br/>
                  • 开启"匹配"可捕获其他玩家与TA的互动
                </>
              )}
            </div>
            
            <div style={{ fontWeight: 600, color: '#007acc', marginBottom: `${8 * scale}px` }}>
              📋 匹配规则说明
            </div>
            <div style={{ color: '#333', marginBottom: `${8 * scale}px` }}>
              <strong>1. 消息类型选项（对话/Emote/动作/其他）</strong>
              <div style={{ color: '#666', marginLeft: `${12 * scale}px`, marginTop: `${2 * scale}px` }}>
                • <span style={{ color: '#28a745' }}>✓ 启用</span>：捕获该玩家发出的此类型消息<br/>
                • <span style={{ color: '#fd7e14' }}>⊘ 排除</span>：排除该玩家发出的此类型消息（优先级最高）<br/>
                • <span style={{ color: '#dc3545' }}>✗ 关闭</span>：不处理该玩家发出的此类型消息
              </div>
            </div>
            <div style={{ color: '#333', marginBottom: `${8 * scale}px` }}>
              <strong>2. 匹配选项</strong>
              <div style={{ color: '#666', marginLeft: `${12 * scale}px`, marginTop: `${2 * scale}px` }}>
                • 将该玩家的<strong>名称和昵称</strong>作为关键字进行匹配<br/>
                • 匹配的是消息<strong>内容</strong>（不含发送者名字、时间等）<br/>
                • <strong>不受消息类型限制</strong>，匹配成功即捕获
              </div>
            </div>
            <div style={{ color: '#333', marginBottom: `${8 * scale}px` }}>
              <strong>3. 排除选项</strong>
              <div style={{ color: '#666', marginLeft: `${12 * scale}px`, marginTop: `${2 * scale}px` }}>
                • 将该玩家的<strong>名称和昵称</strong>作为排除关键字<br/>
                • <strong>优先级最高</strong>：在内容匹配之前检查<br/>
                • 如果消息内容包含该玩家的名称/昵称，则跳过该消息
              </div>
            </div>
            <div style={{ color: '#333', marginBottom: `${8 * scale}px` }}>
              <strong>4. 全局关键字</strong>
              <div style={{ color: '#666', marginLeft: `${12 * scale}px`, marginTop: `${2 * scale}px` }}>
                • 独立于玩家关注列表，匹配所有消息内容<br/>
                • <strong>不受消息类型限制</strong>，匹配成功即捕获
              </div>
            </div>
            <div style={{ 
              color: '#856404', 
              backgroundColor: '#fff3cd', 
              padding: `${6 * scale}px ${10 * scale}px`, 
              borderRadius: `${4 * scale}px`,
              marginTop: `${8 * scale}px`
            }}>
              💡 <strong>匹配优先级：</strong><br/>
              1. 发送者在关注列表 + 消息类型设为"排除" → 跳过消息<br/>
              2. 发送者在关注列表 + 消息类型设为"启用" → 捕获消息<br/>
              3. 检查消息内容是否包含开启了"排除"选项的玩家名称 → 跳过消息<br/>
              4. 检查消息内容是否包含全局关键字 → 捕获消息<br/>
              5. 检查消息内容是否包含开启了"匹配"选项的玩家名称 → 捕获消息<br/>
              6. 以上都不匹配 → 筛选未通过
            </div>
          </div>
        ) : (
          <>
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
                {followedPlayers.map((player: FollowedPlayer) => {
                  const isAllSelected = player.messageTypes.length === ALL_MESSAGE_TYPES.length && 
                                        (player.excludedMessageTypes || []).length === 0 &&
                                        player.contentMatch;
                  
                  return (
                    <tr key={player.id} style={{ backgroundColor: '#fff' }}>
                      <td style={{ padding: `${6 * scale}px ${10 * scale}px`, fontWeight: 500, color: '#333', borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                        {player.id}
                      </td>
                      <td style={{ padding: `${6 * scale}px ${10 * scale}px`, color: '#666', borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                        {player.name || '-'}
                      </td>
                      {ALL_MESSAGE_TYPES.map((type) => {
                        const status = getMessageTypeStatus(player, type);
                        return (
                          <td key={type} style={{ padding: `${6 * scale}px ${4 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              {renderThreeStateButton(
                                status,
                                () => {
                                  const nextStatus: MessageFilterStatus = 
                                    status === 'disabled' ? 'enabled' :
                                    status === 'enabled' ? 'excluded' : 'disabled';
                                  setPlayerMessageTypeStatus(player.id, type, nextStatus);
                                }
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding: `${6 * scale}px ${4 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {renderTwoStateButton(
                            player.contentMatch,
                            () => togglePlayerContentMatch(player.id)
                          )}
                        </div>
                      </td>
                      <td style={{ padding: `${6 * scale}px ${4 * scale}px`, borderBottom: `${1 * scale}px solid #f0f0f0` }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {renderTwoStateButton(
                            isAllSelected,
                            () => handleToggleAllTypes(player.id, player),
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
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
          </>
        )}
        
        <div style={{ 
          padding: `${8 * scale}px ${16 * scale}px`, 
          borderTop: `${1 * scale}px solid #eee`,
          backgroundColor: '#f9f9f9',
          fontSize: `${11 * scale}px`,
          color: '#999'
        }}>
          <span style={{ color: '#28a745' }}>✓ = 启用</span>
          <span style={{ margin: `0 ${8 * scale}px` }}>|</span>
          <span style={{ color: '#fd7e14' }}>⊘ = 排除</span>
          <span style={{ margin: `0 ${8 * scale}px` }}>|</span>
          <span style={{ color: '#dc3545' }}>✗ = 关闭</span>
          <span style={{ margin: `0 ${8 * scale}px` }}>|</span>
          <span>全选 = 一键开启所有类型+匹配</span>
        </div>
        
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: `${16 * scale}px`,
            height: `${16 * scale}px`,
            cursor: 'nwse-resize',
            zIndex: 10
          }}
          title="拖动调整大小"
        >
          <svg
            width={16 * scale}
            height={16 * scale}
            viewBox="0 0 16 16"
            style={{ opacity: 0.5 }}
          >
            <path
              d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14ZM14 6H12V4H14V6ZM10 10H8V8H10V10ZM6 14H4V12H6V14Z"
              fill="#666"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
