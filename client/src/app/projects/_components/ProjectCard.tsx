'use client';

import React from 'react';
import { Folder, Pencil, Trash2, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function formatRelativeTime(date: string | Date | null) {
  if (!date) return 'never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const intervals = {
    y: 31536000,
    mo: 2592000,
    d: 86400,
    h: 3600,
    m: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit} ago`;
    }
  }
  return 'just now';
}

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    lastActivityAt: string | null;
    entryCount: number;
    templateBreakdown: { template_type: string; count: number }[];
    topTags: string[];
    impactSummary: {
      pivotalCount: number;
      significantCount: number;
      minorCount: number;
    };
  };
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

const TEMPLATE_COLORS: Record<string, string> = {
  bug_autopsy: '#fee2e2',
  design_decision: '#ccfbf1',
  technical_challenge: '#ffedd5',
  tradeoff: '#fef3c7',
  lesson_learned: '#dcfce7',
  integration_note: '#f1f5f9',
  general: '#f3f4f6',
};

const TEMPLATE_LABELS: Record<string, string> = {
  bug_autopsy: 'Bug Autopsy',
  design_decision: 'Design Decision',
  technical_challenge: 'Technical Challenge',
  tradeoff: 'Tradeoff',
  lesson_learned: 'Lesson Learned',
  integration_note: 'Integration Note',
  general: 'General',
};

export default function ProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  const maxCount = project.templateBreakdown.length > 0 
    ? Math.max(...project.templateBreakdown.map(t => t.count))
    : 0;

  const top3Templates = project.templateBreakdown.slice(0, 3);

  const highestImpact = project.impactSummary.pivotalCount > 0 
    ? { icon: '🔴', label: 'pivotal', count: project.impactSummary.pivotalCount }
    : project.impactSummary.significantCount > 0
    ? { icon: '🟡', label: 'significant', count: project.impactSummary.significantCount }
    : project.entryCount > 0
    ? { icon: '🟢', label: 'minor', count: project.impactSummary.minorCount }
    : null;

  return (
    <div 
      className="project-card"
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--paper)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', border: '1px solid var(--border)' }}>
          <Folder size={20} />
        </div>
        <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(project.id); }}
            className="icon-btn"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(project.id, project.name); }}
            className="icon-btn"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div style={{ flex: '0 0 auto' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          color: 'var(--ink)', 
          marginBottom: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'Inter, sans-serif'
        }}>
          {project.name}
        </h3>
        <div style={{ 
          fontSize: '13px', 
          color: 'var(--muted)', 
          lineHeight: 1.5, 
          maxHeight: '3em', 
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {project.description ? (
            <div className="card-markdown-description">
              <ReactMarkdown>{project.description}</ReactMarkdown>
            </div>
          ) : (
            <p style={{ fontStyle: 'italic', opacity: 0.7 }}>No description added</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{project.entryCount}</span>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginTop: '2px' }}>entries</span>
        </div>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{formatRelativeTime(project.lastActivityAt)}</span>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginTop: '2px' }}>last sealed</span>
        </div>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {highestImpact ? (
            <>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{highestImpact.icon} {highestImpact.count}</span>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginTop: '2px' }}>{highestImpact.label}</span>
            </>
          ) : (
            <span style={{ fontSize: '14px', color: 'var(--border)' }}>—</span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ flex: 1, minHeight: '80px' }}>
        {project.entryCount > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {top3Templates.map((t) => (
              <div key={t.template_type} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', textTransform: 'uppercase', color: 'var(--muted)', width: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {TEMPLATE_LABELS[t.template_type] || t.template_type.replace(/_/g, ' ')}
                </span>
                <div style={{ flex: 1, height: '4px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(t.count / (maxCount || 1)) * 100}%`, 
                    height: '100%', 
                    background: TEMPLATE_COLORS[t.template_type] || TEMPLATE_COLORS.general,
                    transition: 'width 1s ease-out'
                  }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)', minWidth: '15px', textAlign: 'right' }}>{t.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0', background: 'var(--paper)', borderRadius: '10px' }}>
            No entries yet — seal the first one
          </p>
        )}
      </div>

      {/* Tags Row */}
      {project.topTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {project.topTags.map(tag => (
            <span key={tag} style={{ fontSize: '10px', fontFamily: 'var(--mono)', padding: '3px 8px', borderRadius: '6px', background: 'var(--paper)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <button 
        onClick={() => onView(project.id)}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)',
          background: '#fff', color: 'var(--ink)', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
        className="view-btn"
      >
        View Project <ArrowRight size={14} />
      </button>

      <style jsx>{`
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: var(--ink);
        }
        .icon-btn {
          width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 8px;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0.4; transition: all 0.2s;
        }
        .project-card:hover .icon-btn { opacity: 1; }
        .icon-btn:hover { background: var(--paper); border-color: var(--ink); }
        
        .view-btn:hover { background: var(--paper); border-color: var(--ink); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .card-markdown-description p { margin: 0; }
        .card-markdown-description h1, 
        .card-markdown-description h2, 
        .card-markdown-description h3 { 
          font-size: 14px !important; 
          margin: 0 !important;
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
}
