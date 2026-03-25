'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import AppLayout from '@/components/dashboard/AppLayout';
import FeedCard from '@/components/feed/FeedCard';
import SkeletonCard from '@/components/feed/SkeletonCard';
import styles from './vault.module.css';

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

interface VaultResponse {
  entries: FeedEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const SKELETON_COUNT = 3;

export default function VaultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, _hasHydrated } = useAuthStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

  // State
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Auth check
  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push('/login');
    }
  }, [user, _hasHydrated, router]);

  // Fetch vaulted entries
  const fetchVault = useCallback(async (pageNum: number = 1) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(pageNum === 1);

      const response = await api.get<VaultResponse>('/reflections/vault/list', {
        params: {
          page: pageNum,
          limit: 20,
        },
      });

      if (pageNum === 1) {
        setEntries(response.data.entries);
      } else {
        setEntries((prev) => [...prev, ...response.data.entries]);
      }

      setPage(pageNum);
      setHasMore(response.data.pagination.hasMore);
    } catch (error) {
      console.error('Failed to fetch vault', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVault(1);
  }, [fetchVault]);

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

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 500;

      if (isAtBottom && hasMore && !loading && !loadingRef.current) {
        fetchVault(page + 1);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [page, hasMore, loading, fetchVault]);

  if (!_hasHydrated || !user) {
    return null;
  }

  return (
    <AppLayout title="Vault" subtitle="Your saved reflections and insights">
      <div className={styles.container}>
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
          ) : (
            <div className={styles.emptyState}>
              {searchQuery ? (
                <>
                  <h2 className={styles.emptyTitle}>No vault matches found</h2>
                  <p className={styles.emptySubtitle}>Try a different title, tag, author, or project keyword</p>
                </>
              ) : (
                <>
                  <h2 className={styles.emptyTitle}>Your vault is empty</h2>
                  <p className={styles.emptySubtitle}>Save reflections to your vault to access them later</p>
                  <button
                    className={styles.exploreButton}
                    onClick={() => router.push('/feed')}
                  >
                    Explore the Feed
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
