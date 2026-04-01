'use client';

import React from 'react';
import { Folder, SearchX, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-projects' | 'no-results';
  onAction?: () => void;
  onClear?: () => void;
}

export default function EmptyStates({ type, onAction, onClear }: EmptyStateProps) {
  if (type === 'no-projects') {
    return (
      <div style={{ 
        gridColumn: '1/-1', 
        padding: '100px 40px', 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fff',
        borderRadius: '24px',
        border: '1px dashed var(--border)',
        marginTop: '24px'
      }}>
        <div style={{ width: '80px', height: '80px', background: 'var(--paper)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '24px' }}>
          <Folder size={32} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: '24px', fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--ink)', marginBottom: '12px' }}>
          No projects yet
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '32px', maxWidth: '360px', lineHeight: 1.6 }}>
          Create your first engineering workspace to start sealing entries and documenting your technical growth.
        </p>
        <button 
          onClick={onAction}
          style={{ 
            background: 'var(--ink)', 
            color: '#fff', 
            padding: '14px 32px', 
            borderRadius: '12px', 
            border: 'none', 
            fontSize: '14px', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
          }}
        >
          <PlusCircle size={18} /> Initialize First Workspace
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      gridColumn: '1/-1', 
      padding: '80px 40px', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      background: 'transparent',
      borderRadius: '24px',
      marginTop: '24px'
    }}>
      <SearchX size={48} color="var(--border)" style={{ marginBottom: '20px' }} />
      <h3 style={{ fontSize: '18px', color: 'var(--ink)', fontWeight: 600, marginBottom: '8px' }}>
        No projects match this filter
      </h3>
      <button 
        onClick={onClear}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--amber)', 
          fontSize: '14px', 
          fontWeight: 600, 
          cursor: 'pointer', 
          textDecoration: 'underline',
          textUnderlineOffset: '4px'
        }}
      >
        Clear filter
      </button>
    </div>
  );
}
