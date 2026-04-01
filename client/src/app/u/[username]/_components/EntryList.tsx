'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/profile.module.css';
import { Lock, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

interface Entry {
  id: string;
  title: string;
  template_type: string;
  category: string;
  impact: string;
  visibility: 'public' | 'private';
  totalReactions: number;
  topReactionEmoji: string | null;
  createdAt: string;
  relativeDate: string;
}

interface EntryListProps {
  username: string;
}

const EntryList: React.FC<EntryListProps> = ({ username }) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'most_reacted' | 'by_template'>('recent');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchEntries = async (reset = false) => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${username}/entries`, {
        params: {
          sort: activeTab,
          page: reset ? 1 : page,
          limit: 10,
        },
      });
      const newEntries = response.data.entries;
      setEntries(reset ? newEntries : [...entries, ...newEntries]);
      setHasMore(response.data.hasMore);
      if (reset) setPage(2);
      else setPage(page + 1);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  const groupEntries = () => {
    if (activeTab === 'recent') {
      const groups: Record<string, Entry[]> = {};
      entries.forEach((e) => {
        const date = new Date(e.createdAt);
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(e);
      });
      return Object.entries(groups).map(([label, items]) => ({ label, items }));
    } else if (activeTab === 'by_template') {
      const groups: Record<string, Entry[]> = {};
      entries.forEach((e) => {
        const label = (e.category || e.template_type || 'Unknown').replace(/_/g, ' ').toUpperCase();
        if (!groups[label]) groups[label] = [];
        groups[label].push(e);
      });
      return Object.entries(groups).map(([label, items]) => ({ label: `${label} (${items.length})`, items }));
    }
    return [{ label: '', items: entries }];
  };

  const getImpactClass = (impact: string) => {
    return impact.toLowerCase() === 'pivotal' ? styles.pivotal : '';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bug_autopsy: '#e11d48',
      design_decision: '#0891b2',
      technical_challenge: '#7c3aed',
      tradeoff: '#d97706',
      lesson_learned: '#059669',
    };
    return colors[type.toLowerCase()] || '#6b6760';
  };

  return (
    <div className={styles.entryListSection}>
      <div className={styles.tabs}>
        {(['recent', 'most_reacted', 'by_template'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className={styles.listContainer}>
        {groupEntries().map((group, gIdx) => (
          <div key={gIdx} className={styles.monthGroup}>
            {group.label && <div className={styles.monthLabel}>{group.label}</div>}
            
            {group.items.map((entry) => (
              <div key={entry.id} className={styles.entryRow}>
                {entry.visibility === 'private' && entry.title === 'Private entry' ? (
                  <>
                    <Lock size={14} color="var(--text-muted)" />
                    <div className={styles.entryTitle} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Private entry
                    </div>
                    <div className={styles.entryDate}>{entry.relativeDate}</div>
                  </>
                ) : (
                  <>
                    <div 
                      className={styles.entryTypeDot} 
                      style={{ backgroundColor: getTypeColor(entry.template_type || entry.category) }} 
                    />
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>
                      {(entry.category || entry.template_type).replace(/_/g, ' ')}
                    </div>
                    <a href={`/entry/${entry.id}`} className={styles.entryTitle}>
                      {entry.title}
                    </a>
                    <div className={`${styles.impactBadge} ${getImpactClass(entry.impact)}`}>
                      {entry.impact}
                    </div>
                    {entry.totalReactions > 0 && (
                      <div className={styles.reaction}>
                        {entry.topReactionEmoji && <span style={{ marginRight: '2px' }}>{entry.topReactionEmoji}</span>}
                        <MessageSquare size={12} style={{ opacity: entry.topReactionEmoji ? 0.6 : 1 }} />
                        {entry.totalReactions}
                      </div>
                    )}
                    <div className={styles.entryDate}>{entry.relativeDate}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
          <button 
            className={styles.btn} 
            onClick={() => fetchEntries()}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EntryList;
