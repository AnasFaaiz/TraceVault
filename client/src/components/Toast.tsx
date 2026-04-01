'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div 
      style={{
        position: 'fixed', bottom: '40px', left: '50%', transform: `translateX(-50%) translateY(${isVisible ? '0' : '20px'})`,
        opacity: isVisible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#fff', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 10000
      }}
    >
      {type === 'success' ? (
        <CheckCircle2 size={18} color="var(--teal)" />
      ) : (
        <AlertCircle size={18} color="var(--accent)" />
      )}
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{message}</span>
      <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}>
        <X size={14} />
      </button>
    </div>
  );
}
