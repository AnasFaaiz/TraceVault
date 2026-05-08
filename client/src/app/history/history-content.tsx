'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, CalendarDays, Filter, Loader2 } from 'lucide-react';
import AppLayout from '@/components/dashboard/AppLayout';
import api from '@/lib/api';

type HistoryEntry = {
  id: string;
  title: string;
  template_type: string | null;
  category: string | null;
  impact: string | null;
  tags: string[];
  project: { id: string; name: string } | null;
  totalReactions: number;
  createdAt: string;
  relativeDate: string;
};

type HistoryResponse = {
  entries: HistoryEntry[];
  totalEntries: number;
  hasMore: boolean;
};

function formatTemplate(entry: HistoryEntry) {
  return (entry.template_type || entry.category || 'unknown')
    .replace(/_/g, ' ')
    .toUpperCase();
}

function formatMonthLabel(dateValue: string) {
  return new Date(dateValue)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase();
}

export default function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  const limit = 20;

  const queryParams = useMemo(
    () => ({
      projectId: projectId || undefined,
      category: category || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [projectId, category, startDate, endDate],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (category) params.set('category', category);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    router.replace(params.toString() ? `/history?${params.toString()}` : '/history');
  }, [projectId, category, startDate, endDate, router]);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<HistoryResponse>('/users/me/history', {
          params: {
            page: 1,
            limit,
            ...queryParams,
          },
        });

        if (active) {
          setEntries(response.data.entries);
          setPage(1);
          setHasMore(response.data.hasMore);
          setTotalEntries(response.data.totalEntries);
        }
      } catch (err) {
        if (active) {
          setError('Failed to load your history.');
        }
        console.error('Failed to load history', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [queryParams]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await api.get<HistoryResponse>('/users/me/history', {
        params: {
          page: nextPage,
          limit,
          ...queryParams,
        },
      });

      setEntries((current) => [...current, ...response.data.entries]);
      setPage(nextPage);
      setHasMore(response.data.hasMore);
      setTotalEntries(response.data.totalEntries);
    } catch (err) {
      console.error('Failed to load more history', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((entry) => {
      if (entry.project) {
        map.set(entry.project.id, entry.project.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  const onThisDay = useMemo(() => {
    const today = new Date();
    return entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate() &&
        entryDate.getFullYear() < today.getFullYear()
      );
    });
  }, [entries]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};

    entries.forEach((entry) => {
      const label = formatMonthLabel(entry.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(entry);
    });

    return Object.entries(groups);
  }, [entries]);

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportHistory = async (format: 'json' | 'markdown') => {
    try {
      const response = await api.get('/users/me/history/export', {
        responseType: 'blob',
        params: {
          format,
          ...queryParams,
        },
      });

      downloadFile(
        response.data,
        `tracevault-history-${new Date().toISOString().slice(0, 10)}.${
          format === 'markdown' ? 'md' : 'json'
        }`,
      );
    } catch (err) {
      console.error(`Failed to export history as ${format}`, err);
    }
  };

  return (
    <AppLayout
      title="History"
      subtitle="Your private chronological entry log"
      headerActions={
        <>
          <button
            onClick={() => exportHistory('json')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--border)',
              background: '#fff',
              color: 'var(--ink)',
              borderRadius: 8,
              padding: '9px 12px',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> JSON
          </button>
          <button
            onClick={() => exportHistory('markdown')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--border)',
              background: '#fff',
              color: 'var(--ink)',
              borderRadius: 8,
              padding: '9px 12px',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Markdown
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            padding: 16,
            border: '1px solid var(--border)',
            background: '#fff',
            borderRadius: 16,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              Project
            </span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              Template type
            </span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="bug_autopsy"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              Start date
            </span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
              End date
            </span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--muted)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}
        >
          <Filter size={14} />
          <span>{entries.length} entries loaded</span>
          <span>•</span>
          <span>{totalEntries} total</span>
          <span>•</span>
          <span>{onThisDay.length} on this day</span>
        </div>

        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 48,
              color: 'var(--muted)',
            }}
          >
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              border: '1px solid #efc6c6',
              background: '#fff6f6',
              color: '#9f3a3a',
              padding: 16,
              borderRadius: 12,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section
              style={{
                border: '1px solid var(--border)',
                background: '#fff',
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CalendarDays size={16} color="var(--amber)" />
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>On this day</h2>
              </div>
              {onThisDay.length > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {onThisDay.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{entry.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {formatTemplate(entry)} · {entry.project?.name || 'No project'}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No earlier entries match today&apos;s date.</p>
              )}
            </section>

            <section style={{ position: 'relative', paddingLeft: 18 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 7,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'var(--border)',
                }}
              />
              <div style={{ display: 'grid', gap: 22 }}>
                {groupedEntries.length > 0 ? (
                  groupedEntries.map(([label, items]) => (
                    <div key={label} style={{ position: 'relative', paddingLeft: 16 }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: -1,
                          top: 8,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#0e0d0b',
                          border: '2px solid #f5f2eb',
                        }}
                      />
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          color: 'var(--muted)',
                          marginBottom: 10,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {items.map((entry) => (
                          <article
                            key={entry.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '120px 1fr 90px 120px',
                              gap: 12,
                              alignItems: 'center',
                              padding: '14px 16px',
                              border: '1px solid var(--border)',
                              borderRadius: 14,
                              background: '#fff',
                            }}
                          >
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                              {formatTemplate(entry)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{entry.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {entry.project?.name || 'No project'} · {entry.relativeDate}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, textTransform: 'capitalize' }}>
                              {entry.impact || 'minor'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {entry.totalReactions} reactions
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: 24,
                      border: '1px dashed var(--border)',
                      borderRadius: 14,
                      color: 'var(--muted)',
                      background: '#fff',
                    }}
                  >
                    No history entries match the current filters.
                  </div>
                )}
              </div>
            </section>

            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    color: 'var(--ink)',
                    borderRadius: 999,
                    padding: '10px 16px',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loadingMore ? 'Loading more...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}