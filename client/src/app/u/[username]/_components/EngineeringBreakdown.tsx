'use client';

import React from 'react';
import styles from '@/styles/profile.module.css';

interface EngineeringBreakdownProps {
  username: string;
  totalEntries: number; // For percentage calculations (public)
  totalEntriesSummary: number; // For the "Based on X sealed entries" text
  templateBreakdown: Record<string, number>;
  confidenceBreakdown: {
    yes_fully: number;
    mostly: number;
    not_really: number;
  };
}

const EngineeringBreakdown: React.FC<EngineeringBreakdownProps> = ({ 
  username, 
  totalEntries, 
  totalEntriesSummary,
  templateBreakdown, 
  confidenceBreakdown 
}) => {
  return (
    <div className={styles.breakdownSection}>
      <h3 className={styles.sectionLabel} style={{ marginBottom: '8px' }}>How {username} engineers</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Based on {totalEntriesSummary || totalEntries} sealed entries
      </p>

      <div className={styles.breakdownGrid}>
        <div className={styles.breakdownItem}>
          <h4 style={{ fontSize: '14px', marginBottom: '16px' }}>Template distribution</h4>
          {Object.entries(templateBreakdown).map(([name, count]) => {
            const percentage = Math.round((count / totalEntries) * 100);
            return (
              <div key={name}>
                <div className={styles.progressBarTitle}>
                  <span>{name}</span>
                  <span>{count} ({percentage}%)</span>
                </div>
                <div className={styles.progressContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.breakdownItem}>
          <h4 style={{ fontSize: '14px', marginBottom: '16px' }}>Confidence breakdown</h4>
          <div>
            <div className={styles.progressBarTitle}>
              <span>Yes fully</span>
              <span>{confidenceBreakdown.yes_fully}%</span>
            </div>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${confidenceBreakdown.yes_fully}%`, background: '#059669' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className={styles.progressBarTitle}>
              <span>Mostly</span>
              <span>{confidenceBreakdown.mostly}%</span>
            </div>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${confidenceBreakdown.mostly}%`, background: '#2563eb' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className={styles.progressBarTitle}>
              <span>Not really</span>
              <span>{confidenceBreakdown.not_really}%</span>
            </div>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${confidenceBreakdown.not_really}%`, background: '#dc2626' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineeringBreakdown;
