'use client';

import React from 'react';
import { Pencil, Trash2, ArrowRight, Lock, Globe } from 'lucide-react';

interface CollectionRowProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    visibility: 'private' | 'public';
    entryCount: number;
    updatedAt: string;
    relativeDate: string;
    previewTitles: string[];
  };
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

export default function CollectionRow({ collection, onEdit, onDelete, onView }: CollectionRowProps) {
  return (
    <div 
      className="collection-row"
      onClick={() => onView(collection.id)}
      style={{
        padding: '24px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        background: 'transparent'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Main Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px' }}>📚</span>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: 'var(--ink)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {collection.name}
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {collection.entryCount} entries
          </span>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            padding: '2px 8px', 
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: collection.visibility === 'public' ? 'rgba(20, 184, 166, 0.1)' : 'var(--paper)',
            color: collection.visibility === 'public' ? 'var(--teal)' : 'var(--muted)',
            border: `1px solid ${collection.visibility === 'public' ? 'rgba(20, 184, 166, 0.2)' : 'var(--border)'}`
          }}>
            {collection.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} />}
            {collection.visibility}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto', paddingRight: '20px' }}>
            {collection.relativeDate}
          </span>
        </div>

        {/* Preview Line */}
        <div style={{ paddingLeft: '32px' }}>
          <p style={{ 
            fontSize: '13px', 
            color: 'var(--muted)', 
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '80%'
          }}>
            {collection.previewTitles.length > 0 ? (
              <>
                {collection.previewTitles.join(' · ')}
                {collection.entryCount > 3 && <span style={{ opacity: 0.7 }}> · +{collection.entryCount - 3} more</span>}
              </>
            ) : (
              <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Empty collection</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onView(collection.id); }}
          style={{ 
            background: 'none', border: 'none', color: 'var(--ink)', 
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          View <ArrowRight size={14} />
        </button>
        <div className="icon-btns" style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(collection.id); }}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(collection.id, collection.name); }}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .collection-row:hover {
          background: var(--paper);
        }
        .collection-row:hover .icon-btns {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .icon-btns { opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}
