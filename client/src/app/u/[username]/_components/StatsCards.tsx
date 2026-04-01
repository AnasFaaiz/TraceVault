'use client';

import React from 'react';
import styles from '@/styles/profile.module.css';
import { Layers, Zap, Flame } from 'lucide-react';

interface StatsCardsProps {
  data: {
    totalEntries: number;
    totalProjects: number;
    pivotalCount: number;
    significantCount: number;
    minorCount: number;
    currentStreak: number;
    longestStreak: number;
    privateCount: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)' }}>
          <Layers size={16} />
          <span style={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Volume</span>
        </div>
        <div className={styles.statValue}>
          {data.totalEntries} entries sealed
        </div>
        <div className={styles.statSubtext}>
          across {data.totalProjects} project{data.totalProjects !== 1 ? 's' : ''}
          {data.privateCount > 0 && ` · ${data.privateCount} private entries`}
        </div>
      </div>

      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)' }}>
          <Zap size={16} />
          <span style={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Impact</span>
        </div>
        <div className={styles.statValue}>
          {data.pivotalCount} Pivotal entries
        </div>
        <div className={styles.statSubtext}>
          {data.significantCount} Significant · {data.minorCount} Minor
        </div>
      </div>

      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)' }}>
          <Flame size={16} />
          <span style={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Streak</span>
        </div>
        <div className={styles.statValue}>
          {data.currentStreak} day streak
        </div>
        <div className={styles.statSubtext}>
          Best: {data.longestStreak} days
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
