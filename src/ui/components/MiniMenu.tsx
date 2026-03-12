import React, { useEffect, useRef } from 'react';

export interface MiniMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position: { x: number; y: number };
}

export const MiniMenu: React.FC<MiniMenuProps> = ({
  isOpen,
  onClose,
  children,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y + 35,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '8px',
        minWidth: '180px',
        zIndex: 10001,
        border: '1px solid #e0e0e0',
        animation: 'menuFadeIn 0.15s ease-out'
      }}
    >
      <style>{`
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {children}
    </div>
  );
};

export interface MenuItemProps {
  icon?: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  active = false
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        backgroundColor: active ? '#e3f2fd' : 'transparent',
        color: active ? '#007acc' : '#333',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        transition: 'background-color 0.15s ease',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export const MenuDivider: React.FC = () => {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: '#e0e0e0',
        margin: '6px 0'
      }}
    />
  );
};