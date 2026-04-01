'use client';

import React from 'react';
import styles from '@/styles/profile.module.css';

interface ActivityHeatmapProps {
  data: {
    date: string;
    count: number;
  }[];
  totalLastYear: number;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, totalLastYear }) => {
  const getIntensityClass = (count: number) => {
    if (count === 0) return '';
    if (count === 1) return styles.dayLow;
    if (count === 2) return styles.dayMedium;
    return styles.dayHigh;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Group data by week (7 days)
  const weeks: { date: string, count: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Calculate month labels positions
  const monthLabels: { label: string, weekIndex: number }[] = [];
  let currentMonth = -1;
  weeks.forEach((week, index) => {
    const date = new Date(week[0].date);
    const month = date.getMonth();
    if (month !== currentMonth) {
      monthLabels.push({ label: months[month], weekIndex: index });
      currentMonth = month;
    }
  });

  return (
    <div className={styles.heatmapSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className={styles.sectionLabel} style={{ marginBottom: 0 }}>Entry activity — last 12 months</h3>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {totalLastYear} ENTRIES IN THE LAST YEAR
        </div>
      </div>
      
      <div className={styles.heatmapContainer}>
        <div className={styles.heatmapScroll}>
          <div style={{ display: 'flex' }}>
            <div className={styles.dayLabels}>
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div className={styles.heatmapLabels}>
                {monthLabels.map((m, i) => (
                  <div key={i} style={{ gridColumnStart: m.weekIndex + 1 }}>{m.label}</div>
                ))}
              </div>
              
              <div className={styles.heatmapGrid}>
                {data.map((day, i) => (
                  <div 
                    key={i} 
                    className={`${styles.heatmapCell} ${getIntensityClass(day.count)}`}
                    title={`${day.count} entries on ${new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
