import React, { useRef } from 'react';

export interface MiniMenuProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  position: { x: number; y: number };
}

export const MiniMenu: React.FC<MiniMenuProps> = ({
  isOpen,
  children,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

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

export interface MenuCollapseProps {
  icon?: string;
  label: string;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const MenuCollapse: React.FC<MenuCollapseProps> = ({
  icon,
  label,
  isOpen = false,
  onToggle,
  children
}) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#333',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 400,
          transition: 'background-color 0.15s ease',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
          <span>{label}</span>
        </div>
        <span style={{
          fontSize: '10px',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          left: '100%',
          top: 0,
          marginLeft: '4px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '8px',
          minWidth: '160px',
          zIndex: 10002,
          border: '1px solid #e0e0e0'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export interface MenuSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue?: string;
}

export const MenuSlider: React.FC<MenuSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue
}) => {
  return (
    <div style={{
      padding: '8px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <span>{label}</span>
        <span style={{ color: '#007acc', fontWeight: 500 }}>
          {displayValue || value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          background: `linear-gradient(to right, #007acc 0%, #007acc ${((value - min) / (max - min)) * 100}%, #ddd ${((value - min) / (max - min)) * 100}%, #ddd 100%)`,
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none'
        }}
      />
    </div>
  );
};