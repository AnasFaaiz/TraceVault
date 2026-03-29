'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './FeedTabs.module.css';

type FeedView = 'for_you' | 'from_your_stack';

interface FeedTabsProps {
  activeView?: FeedView;
}

const FeedTabs = ({ activeView = 'for_you' }: FeedTabsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs: { id: FeedView; label: string }[] = [
    { id: 'for_you', label: 'FOR YOU' },
    { id: 'from_your_stack', label: 'FROM YOUR STACK' },
  ];

  const handleTabClick = (view: FeedView) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        {tabs.map((tab, index) => [
          <button
            key={tab.id}
            className={`${styles.tab} ${activeView === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>,
          index < tabs.length - 1 ? (
            <span key={`${tab.id}-sep`} className={styles.separator} aria-hidden="true">
              |
            </span>
          ) : null,
        ])}
      </div>
    </div>
  );
};

export default FeedTabs;
