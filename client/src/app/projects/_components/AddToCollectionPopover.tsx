'use client';

import React, { useState, useEffect } from 'react';
import { Check, Loader2, Bookmark } from 'lucide-react';
import api from '@/lib/api';

interface AddToCollectionPopoverProps {
  entryId: string;
  onClose: () => void;
}

export default function AddToCollectionPopover({ entryId, onClose }: AddToCollectionPopoverProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await api.get(`/collections/for-entry/${entryId}`);
        setCollections(response.data.collections);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStates();
  }, [entryId]);

  const toggleCollection = async (collectionId: string) => {
    // Optimistic UI
    const updated = collections.map(c => 
      c.id === collectionId ? { ...c, isMember: !c.isMember } : c
    );
    setCollections(updated);

    try {
      await api.post(`/collections/${collectionId}/entries`, { entryId });
    } catch (err) {
      console.error(err);
      // Revert on error
      setCollections(collections);
    }
  };

  return (
    <div 
      style={{
        position: 'absolute', right: 0, top: '100%', marginTop: '8px',
        width: '240px', background: '#fff', border: '1px solid var(--border)',
        borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        zIndex: 5000, padding: '16px', animation: 'scaleUp 0.2s ease-out'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--muted)', margin: 0, textTransform: 'uppercase' }}>Add to Collection</h4>
        <Bookmark size={14} color="var(--muted)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center' }}><Loader2 className="animate-spin" size={16} /></div>
        ) : collections.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, textAlign: 'center', padding: '12px 0' }}>No collections found.</p>
        ) : (
          collections.map(c => (
            <button 
              key={c.id}
              onClick={() => toggleCollection(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '10px 12px', borderRadius: '10px', border: 'none',
                background: c.isMember ? 'var(--paper)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
              }}
              className="col-toggle-btn"
            >
              <div style={{ 
                width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: c.isMember ? 'var(--ink)' : 'transparent',
                borderColor: c.isMember ? 'var(--ink)' : 'var(--border)'
              }}>
                {c.isMember && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
            </button>
          ))
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px' }}>
        <button 
          onClick={() => { onClose(); /* Handle navigation? */ }}
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
          CLOSE
        </button>
      </div>

      <style jsx>{`
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .col-toggle-btn:hover { background: var(--paper); }
      `}</style>
    </div>
  );
}
