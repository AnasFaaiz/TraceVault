"use client";

import { ArrowUpRight, Loader2, Filter, X } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';

interface Reflection {
    id: string;
    title: string;
    type: string;
    project: { 
        name: string;
        user?: { name: string };
    };
    createdAt: string;
}

const TYPE_STYLES: Record<string, { label: string; bg: string; color: string }> = {
    challenge: { label: 'Challenge', bg: '#fdf0ea', color: '#8b3e2a' },
    decision: { label: 'Decision', bg: '#edf7f4', color: '#2a6b5e' },
    tradeoff: { label: 'Tradeoff', bg: '#fdf6e8', color: '#854f0b' },
    lesson: { label: 'Lesson', bg: '#f0f0f8', color: '#4a4a8a' },
};

const IMPACT_STYLES: Record<string, { label: string; color: string }> = {
    minor: { label: 'Minor', color: 'var(--muted)' },
    significant: { label: 'Significant', color: 'var(--amber)' },
    pivotal: { label: 'Pivotal', color: 'var(--rust)' },
};

function FeedContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    
    const [feedItems, setFeedItems] = useState<Reflection[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [activeImpact, setActiveImpact] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reflections/search', {
                    params: {
                        q: query || undefined,
                        type: activeType || undefined,
                        impact: activeImpact || undefined,
                        scope: 'global'
                    }
                });
                setFeedItems(response.data);
            } catch (err) {
                console.error('Failed to fetch feed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [query, activeType, activeImpact]);

    const formatDate = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <AppLayout title="Engineering Thoughts" subtitle="Community Feed">
            <div className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 400, color: '#0e0d0b', marginBottom: 4 }}>
                            {query ? <>Search Results for <em style={{ color: 'var(--amber)' }}>"{query}"</em></> : <>Community <em style={{ color: 'var(--amber)' }}>Insights</em></>}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.6 }}>
                            {query ? `Found ${feedItems.length} matching reflections in the vault.` : 'Latest engineering reflections from across the vault.'}
                        </p>
                    </div>

                    {/* Filter Rail */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', background: 'var(--paper-dark)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <button 
                                onClick={() => setActiveType(null)}
                                style={{ padding: '6px 12px', fontSize: 11, border: 'none', background: activeType === null ? 'var(--ink)' : 'transparent', color: activeType === null ? '#fff' : 'var(--muted)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', transition: 'all 0.2s' }}>
                                All Types
                            </button>
                            {Object.entries(TYPE_STYLES).map(([key, style]) => (
                                <button 
                                    key={key}
                                    onClick={() => setActiveType(key)}
                                    style={{ padding: '6px 12px', fontSize: 11, border: 'none', background: activeType === key ? 'var(--ink)' : 'transparent', color: activeType === key ? '#fff' : 'var(--muted)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', transition: 'all 0.2s' }}>
                                    {style.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            {['minor', 'significant', 'pivotal'].map(impact => (
                                <button
                                    key={impact}
                                    onClick={() => setActiveImpact(activeImpact === impact ? null : impact)}
                                    style={{
                                        padding: '6px 12px', fontSize: 10, fontFamily: 'var(--mono)', 
                                        borderRadius: 8, border: '1px solid ' + (activeImpact === impact ? 'var(--ink)' : 'var(--border)'),
                                        background: activeImpact === impact ? 'var(--ink)' : '#fff',
                                        color: activeImpact === impact ? '#fff' : 'var(--muted)',
                                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}
                                >
                                    {impact}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {loading ? (
                        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                            <Loader2 size={32} color="var(--amber)" className="animate-spin" />
                        </div>
                    ) : feedItems.length > 0 ? (
                        feedItems.map((item) => {
                            const typeStyle = TYPE_STYLES[item.type?.toLowerCase()] ?? TYPE_STYLES.lesson;
                            return (
                                <div key={item.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 24, transition: 'transform 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--paper-dark)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: 'var(--ink)' }}>
                                                {item.project.user?.name[0] || '?'}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.project.user?.name || 'Anonymous'}</p>
                                                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate(item.createdAt)}</p>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--mono)', fontSize: 10,
                                            fontWeight: 500, letterSpacing: '0.06em',
                                            padding: '3px 8px', borderRadius: 4,
                                            background: typeStyle.bg, color: typeStyle.color,
                                        }}>
                                            {typeStyle.label}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>{item.title}</h3>
                                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                                        In project <span style={{ color: 'var(--ink)', fontWeight: 400 }}>{item.project.name}</span>
                                    </p>
                                    <button style={{ color: 'var(--amber)', background: 'none', border: 'none', fontSize: 12, fontWeight: 500, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        Read reflection <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', background: '#fff', borderRadius: 12, border: '1px dotted var(--border)' }}>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic' }}>The vault is quiet.</p>
                            <p style={{ fontSize: 14, marginTop: 8 }}>Be the first to share a new reflection with the community.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                .action-card {
                  background: #fff; border: 1px solid var(--border); border-radius: 10px;
                  padding: 22px; cursor: pointer; transition: box-shadow 0.2s, transform 0.15s;
                  display: flex; flex-direction: column; gap: 10px;
                }
                .action-card:hover { box-shadow: 0 4px 20px rgba(14,13,11,0.08); transform: translateY(-2px); }
            `}</style>
        </AppLayout>
    );
}

export default function FeedPage() {
    return (
        <Suspense fallback={<div style={{ padding: 100, textAlign: 'center' }}><Loader2 className="animate-spin" /></div>}>
            <FeedContent />
        </Suspense>
    );
}
