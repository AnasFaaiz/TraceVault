'use client';

import { Search } from 'lucide-react';

interface GlobalSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  rightActions?: React.ReactNode;
}

const GlobalSearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  rightActions,
}: GlobalSearchBarProps) => {
  return (
    <form onSubmit={onSubmit} style={{ width: '100%', position: 'relative' }}>
      <Search
        size={14}
        color="var(--muted)"
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 52px 10px 40px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--paper-dark)',
          fontSize: 13,
          outline: 'none',
          transition: 'all 0.2s',
          fontFamily: 'var(--mono)',
        }}
        onFocus={(e) => {
          e.target.style.background = '#fff';
        }}
        onBlur={(e) => {
          e.target.style.background = 'var(--paper-dark)';
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {rightActions}
      </div>
    </form>
  );
};

export default GlobalSearchBar;