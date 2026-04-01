'use client';

import React, { useState } from 'react';
import { Lock, Globe, X, Loader2 } from 'lucide-react';

interface NewCollectionModalProps {
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  initialData?: { name: string; description: string; visibility: 'private' | 'public' };
  isEditing?: boolean;
}

export default function NewCollectionModal({ onClose, onSave, initialData, isEditing }: NewCollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    visibility: initialData?.visibility || 'private'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5000, backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px', background: '#fff', 
          borderRadius: '24px', padding: '40px', position: 'relative',
          boxShadow: '0 20px 80px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--paper)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="var(--muted)" />
        </button>

        <h3 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--serif)', marginBottom: '8px' }}>
          {isEditing ? 'Edit Collection' : 'Create New Collection'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '32px' }}>
          Group entries from any project into curated collections — like a reading list for your knowledge.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Collection Name</label>
            <input 
              required
              autoFocus
              value={data.name}
              onChange={e => setData({...data, name: e.target.value})}
              placeholder="e.g. Auth Lessons, React Patterns" 
              style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--paper)', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Description (optional)</label>
            <textarea 
              value={data.description}
              onChange={e => setData({...data, description: e.target.value})}
              placeholder="What is this collection about?" 
              style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--paper)', fontSize: '14px', minHeight: '80px', maxHeight: '120px', resize: 'vertical', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Visibility</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--paper)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <button 
                type="button"
                onClick={() => setData({...data, visibility: 'private'})}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: data.visibility === 'private' ? '#fff' : 'transparent',
                  color: data.visibility === 'private' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: data.visibility === 'private' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                <Lock size={14} /> Private
              </button>
              <button 
                type="button"
                onClick={() => setData({...data, visibility: 'public'})}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: data.visibility === 'public' ? '#fff' : 'transparent',
                  color: data.visibility === 'public' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: data.visibility === 'public' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                <Globe size={14} /> Public
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>
              Public collections appear on your engineering profile.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !data.name}
              style={{ flex: 1.5, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--ink)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : isEditing ? 'Update Collection' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(40px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
      `}</style>
    </div>
  );
}
