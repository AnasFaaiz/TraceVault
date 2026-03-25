'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';
import FeedTabs from '@/components/feed/FeedTabs';
import FeedCard from '@/components/feed/FeedCard';
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
    felt_this: { count: number; reacted: boolean };
    critical: { count: number; reacted: boolean };
    noted: { count: number; reacted: boolean };
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

const SKELETON_COUNT = 3;

export default function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get URL parameters
  const view = (searchParams.get('view') || 'for_you') as 'for_you' | 'from_your_stack' | 'trending';
  const tags = searchParams.get('tags');
  const templateTypes = searchParams.get('template_type');
  const impact = searchParams.get('impact');
  const confidence = searchParams.get('confidence');
  const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

  // State
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newEntriesCount, setNewEntriesCount] = useState(0);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
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
        setTotalPages(Math.ceil(response.data.pagination.total / response.data.pagination.limit));
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

    if (view === 'trending' && entries.length === 0 && !loading) {
      return {
        title: 'Nothing trending yet',
        subtitle: 'Be the first to seal an entry',
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
      className={styles.filterButton}
      onClick={() => setIsFilterPanelOpen(true)}
    >
      <Filter size={16} />
      FILTERS
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
    >
      <div className={styles.container}>
        <FeedTabs activeView={view} />

        {newEntriesCount > 0 && (
          <button
            className={styles.newEntriesBanner}
            onClick={handleLoadNewEntries}
          >
            {newEntriesCount} new {newEntriesCount === 1 ? 'entry' : 'entries'} — click to load
          </button>
        )}

        <div className={styles.feed} ref={scrollContainerRef}>
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

        <FiltersPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          activeView={view}
        />
      </div>
    </AppLayout>
  );
}
