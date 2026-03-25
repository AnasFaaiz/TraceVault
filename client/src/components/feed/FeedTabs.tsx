'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './FeedTabs.module.css';

type FeedView = 'for_you' | 'from_your_stack' | 'trending';

interface FeedTabsProps {
  activeView?: FeedView;
}

const FeedTabs = ({ activeView = 'for_you' }: FeedTabsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs: { id: FeedView; label: string }[] = [
    { id: 'for_you', label: 'FOR YOU' },
    { id: 'from_your_stack', label: 'FROM YOUR STACK' },
    { id: 'trending', label: 'TRENDING' },
  ];

  const handleTabClick = (view: FeedView) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeView === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.underline} style={{
        left: `calc(${tabs.findIndex(t => t.id === activeView) * 33.333}% + 1rem)`,
      }} />
    </div>
  );
};

export default FeedTabs;
