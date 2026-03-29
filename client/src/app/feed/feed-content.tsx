'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';
import FeedCard from '@/components/feed/FeedCard';
import FeedTabs from '@/components/feed/FeedTabs';
import SkeletonCard from '@/components/feed/SkeletonCard';
import FiltersPanel from '@/components/feed/FiltersPanel';
import styles from './feed.module.css';

interface FeedEntry {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags: string[];
  snippet: string;
  readTime: string;
  confidence: string | null;
  createdAt: string;
  relativeDate: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  reactions: {
    useful: { count: number; reacted: boolean };
    critical: { count: number; reacted: boolean };
    applied: { count: number; reacted: boolean };
  };
  vaulted: boolean;
}

interface FeedResponse {
  entries: FeedEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

type TrendingPeriod = '24h' | '7d' | '30d';

interface TrendingTraceCard {
  id: string;
  title: string;
  category: 'Technical Challenge' | 'Design Decision' | 'Lesson Learned';
  severity: 'Minor' | 'Significant' | 'Pivotal';
  tags: string[];
  insightStrength: number;
  learningMomentum: number;
  contributors: {
    avatars: string[];
    count: number;
  };
  activityCount: number;
  trendStartedAt: string;
}

interface TrendingResponse {
  period: TrendingPeriod;
  entries: TrendingTraceCard[];
}

const SKELETON_COUNT = 3;
type FeedView = 'for_you' | 'from_your_stack';

export default function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get URL parameters
  const viewParam = searchParams.get('view');
  const view: FeedView = viewParam === 'from_your_stack' ? 'from_your_stack' : 'for_you';
  const tags = searchParams.get('tags');
  const templateTypes = searchParams.get('template_type');
  const impact = searchParams.get('impact');
  const confidence = searchParams.get('confidence');
  const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

  // State
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newEntriesCount, setNewEntriesCount] = useState(0);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>('24h');
  const [trendingEntries, setTrendingEntries] = useState<TrendingTraceCard[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const loadingRef = useRef(false);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    if (templateTypes?.split(',').filter(Boolean).length) count++;
    if (impact?.split(',').filter(Boolean).length) count++;
    if (confidence && confidence !== 'any') count++;
    if (tags?.split(',').filter(Boolean).length) count += tags.split(',').filter(Boolean).length;
    setActiveFilterCount(count);
  }, [templateTypes, impact, confidence, tags]);

  // Fetch feed
  const fetchFeed = useCallback(
    async (pageNum: number = 1) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        setLoading(pageNum === 1);

        const response = await api.get<FeedResponse>('/reflections/feed/personalized', {
          params: {
            view,
            tags: tags || undefined,
            template_type: templateTypes || undefined,
            impact: impact || undefined,
            confidence: confidence || undefined,
            page: pageNum,
            limit: 20,
          },
        });

        if (pageNum === 1) {
          setEntries(response.data.entries);
          setNewEntriesCount(0);
        } else {
          setEntries((prev) => [...prev, ...response.data.entries]);
        }

        setPage(pageNum);
        setHasMore(response.data.pagination.hasMore);
      } catch (error) {
        console.error('Failed to fetch feed', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [view, tags, templateTypes, impact, confidence],
  );

  // Initial fetch when parameters change
  useEffect(() => {
    setPage(1);
    setEntries([]);
    setNewEntriesCount(0);
    fetchFeed(1);
  }, [view, tags, templateTypes, impact, confidence, fetchFeed]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 500;

      if (isAtBottom && hasMore && !loading && !loadingRef.current) {
        fetchFeed(page + 1);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [page, hasMore, loading, fetchFeed]);

  // Check for new entries periodically
  useEffect(() => {
    const checkNewEntries = async () => {
      try {
        const response = await api.get<FeedResponse>('/reflections/feed/personalized', {
          params: {
            view,
            tags: tags || undefined,
            template_type: templateTypes || undefined,
            impact: impact || undefined,
            confidence: confidence || undefined,
            page: 1,
            limit: 1,
          },
        });

        if (response.data.pagination.total > entries.length + newEntriesCount) {
          setNewEntriesCount(response.data.pagination.total - entries.length);
        }
      } catch (error) {
        console.error('Failed to check new entries', error);
      }
    };

    const interval = setInterval(checkNewEntries, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [view, tags, templateTypes, impact, confidence, entries.length, newEntriesCount]);

  const handleLoadNewEntries = () => {
    setEntries([]);
    setPage(1);
    setNewEntriesCount(0);
    fetchFeed(1);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;

    return entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.snippet,
        entry.author.username,
        entry.project.name,
        entry.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchQuery);
    });
  }, [entries, searchQuery]);

  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true);
    try {
      const response = await api.get<TrendingResponse>('/reflections/trending', {
        params: {
          period: trendingPeriod,
          limit: 5,
        },
      });
      setTrendingEntries(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch trending entries', error);
      setTrendingEntries([]);
    } finally {
      setTrendingLoading(false);
    }
  }, [trendingPeriod]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const getRelativeTrendTime = useCallback((isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return {
        title: 'No matches found',
        subtitle: 'Try a different title, tag, author, or project keyword',
      };
    }

    if (view === 'for_you' && entries.length === 0 && !loading) {
      return {
        title: 'No entries match your stack yet',
        subtitle: 'Start adding entries with tags to personalize this feed',
      };
    }

    if (tags || templateTypes || impact || confidence) {
      return {
        title: 'No entries match these filters',
        subtitle: 'Try adjusting your filters',
      };
    }

    return null;
  };

  const emptyState = getEmptyStateMessage();

  const filterButton = (
    <button
      type="button"
      className={styles.filterInlineButton}
      onClick={() => setIsFilterPanelOpen(true)}
      aria-label="Open filters"
      title="Filters"
    >
      <Filter size={16} />
      {activeFilterCount > 0 && (
        <span className={styles.filterBadge}>{activeFilterCount}</span>
      )}
    </button>
  );

  return (
    <AppLayout
      title="Community Feed"
      subtitle="Discover and engage with reflections from your engineering community"
      headerActions={filterButton}
      headerLeftContent={<FeedTabs activeView={view} />}
      onReflectionCreated={handleLoadNewEntries}
    >
      <div className={styles.container}>
        {newEntriesCount > 0 && (
          <button
            className={styles.newEntriesBanner}
            onClick={handleLoadNewEntries}
          >
            {newEntriesCount} new {newEntriesCount === 1 ? 'entry' : 'entries'} — click to load
          </button>
        )}

        <div className={styles.feed} ref={scrollContainerRef}>
          <div className={styles.feedLayout}>
            <div className={styles.feedMainColumn}>
              {loading && entries.length === 0 ? (
                <div className={styles.feedGrid}>
                  {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredEntries.length > 0 ? (
                <>
                  <div className={styles.feedGrid}>
                    {filteredEntries.map((entry) => (
                      <FeedCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                  {loading && page > 1 && (
                    <div className={styles.loadingMore}>
                      <div className={styles.skeletonRow}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <SkeletonCard key={i} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : emptyState ? (
                <div className={styles.emptyState}>
                  <h2 className={styles.emptyTitle}>{emptyState.title}</h2>
                  <p className={styles.emptySubtitle}>{emptyState.subtitle}</p>
                  {(tags || templateTypes || impact || confidence) && (
                    <button
                      className={styles.clearFiltersLink}
                      onClick={() => router.push(`/feed?view=${view}`)}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            <aside className={styles.rightRail}>
              <section className={styles.railSection}>
                <div className={styles.railHeader}>
                  <h3 className={styles.railTitle}>Trending</h3>
                  <div className={styles.periodSwitch}>
                    {[
                      { value: '24h', label: 'Today' },
                      { value: '7d', label: 'Week' },
                      { value: '30d', label: 'Month' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.periodButton} ${
                          trendingPeriod === option.value ? styles.periodButtonActive : ''
                        }`}
                        onClick={() => setTrendingPeriod(option.value as TrendingPeriod)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {trendingLoading ? (
                  <ul className={styles.rankedSkeletonList} aria-hidden="true">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <li key={index} className={styles.rankedSkeletonItem}>
                        <span className={styles.rankSkeletonTitle} />
                        <span className={styles.rankSkeletonTitleShort} />
                        <div className={styles.rankSkeletonSocialRow}>
                          <span className={styles.rankSkeletonAvatar} />
                          <span className={styles.rankSkeletonSocialText} />
                        </div>
                        <div className={styles.rankSkeletonTagsRow}>
                          <span className={styles.rankSkeletonTag} />
                          <span className={styles.rankSkeletonTag} />
                          <span className={styles.rankSkeletonTag} />
                        </div>
                        <span className={styles.rankSkeletonMeta} />
                        <div className={styles.rankSkeletonHighlightRow}>
                          <span className={styles.rankSkeletonBadge} />
                          <span className={styles.rankSkeletonBadgeWide} />
                          <span className={styles.rankSkeletonTime} />
                        </div>
                        <span className={styles.rankSkeletonText} />
                      </li>
                    ))}
                  </ul>
                ) : trendingEntries.length > 0 ? (
                  <ol className={styles.rankedList}>
                    {trendingEntries.map((entry) => (
                      <li key={entry.id} className={styles.trendingItem}>
                        <div className={styles.trendingTitleRow}>
                          <span className={styles.rankedText}>{entry.title}</span>
                        </div>

                        <div className={styles.contributorRow}>
                          <div className={styles.avatarStack}>
                            {Array.from({
                              length: Math.min(
                                3,
                                Math.max(entry.contributors.avatars.length, entry.contributors.count || 0),
                              ),
                            }).map((_, avatarIndex) => (
                              <span
                                key={avatarIndex}
                                className={styles.contributorAvatarPlaceholder}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span className={styles.contributorCount}>
                            {entry.contributors.count} developers faced this issue
                          </span>
                        </div>

                        {entry.tags.length > 0 && (
                          <div className={styles.tagList}>
                            {entry.tags.slice(0, 3).map((tag) => (
                              <span key={`${entry.id}-${tag}`} className={styles.railTag}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className={styles.trendingMeta}>
                          {entry.category} · {entry.severity}
                        </p>

                        <div className={styles.trendingHighlightRow}>
                          <span className={`${styles.trendingBadge} ${styles.insightBadge}`}>
                            Insight Strength {entry.insightStrength}%
                          </span>
                          <span className={`${styles.trendingBadge} ${styles.momentumBadge}`}>
                            Momentum {entry.learningMomentum >= 0 ? '+' : ''}
                            {entry.learningMomentum}%
                          </span>
                          <span className={styles.trendingTimeInline}>
                            {getRelativeTrendTime(entry.trendStartedAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.railEmpty}>No trending entries yet</p>
                )}
              </section>
            </aside>
          </div>
        </div>

        <FiltersPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          activeView={view}
        />
      </div>
    </AppLayout>
  );
}
