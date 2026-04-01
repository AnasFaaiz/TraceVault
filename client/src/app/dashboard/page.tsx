"use client";

import {
    Plus, ArrowUpRight, Loader2, TrendingUp, Folder, Bookmark
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReflectionModal } from '@/store/useReflectionModal';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';
import AddToCollectionPopover from '@/app/projects/_components/AddToCollectionPopover';

interface Project {
    id: string;
    name: string;
    _count: { reflections: number };
}

interface Reflection {
    id: string;
    title: string;
    type: string;
    project: { name: string };
    createdAt: string;
}

const TYPE_STYLES: Record<string, { label: string; bg: string; color: string }> = {
    challenge: { label: 'Challenge', bg: '#fdf0ea', color: '#8b3e2a' },
    decision: { label: 'Decision', bg: '#edf7f4', color: '#2a6b5e' },
    tradeoff: { label: 'Tradeoff', bg: '#fdf6e8', color: '#854f0b' },
    lesson: { label: 'Lesson', bg: '#f0f0f8', color: '#4a4a8a' },
};

export default function Dashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [loading, setLoading] = useState(true);
    const [popoverEntryId, setPopoverEntryId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, r] = await Promise.all([
                    api.get('/projects'), 
                    api.get('/reflections/recent'),
                ]);
                setProjects(p.data.projects || p.data);
                setReflections(r.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (!user) return null;

    const welcomeMsg = `Welcome back, ${user.name.split(' ')[0]}`;

    return (
        <AppLayout title="Dashboard" subtitle={welcomeMsg}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[
                        { label: 'Projects', value: projects.length, note: 'active' },
                        { label: 'Reflections', value: reflections.length, note: 'recent' },
                        {
                            label: 'This month', value: reflections.filter((r: Reflection) => {
                                const d = new Date(r.createdAt);
                                const now = new Date();
                                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                            }).length, note: 'entries'
                        },
                    ].map(({ label, value, note }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>{label}</p>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 500, color: 'var(--ink)', lineHeight: 1 }}>{loading ? '—' : value}</p>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{note}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[
                        {
                            icon: <Plus size={18} />,
                            iconBg: '#fdf6e8', iconColor: '#c8852a',
                            title: 'New reflection',
                            desc: 'Document a design decision, tradeoff, or lesson learned.',
                            onClick: () => useReflectionModal.getState().open()
                        },
                        {
                            icon: <Folder size={18} />,
                            iconBg: '#edf7f4', iconColor: '#2a6b5e',
                            title: 'Browse projects',
                            desc: `You have ${projects.length} project${projects.length !== 1 ? 's' : ''} with logged reflections.`,
                            onClick: () => router.push('/projects')
                        },
                        {
                            icon: <TrendingUp size={18} />,
                            iconBg: '#f0f0f8', iconColor: '#4a4a8a',
                            title: 'Review growth',
                            desc: 'See how your engineering thinking has evolved over time.',
                            onClick: () => router.push('/history')
                        },
                    ].map(({ icon, iconBg, iconColor, title, desc, onClick }) => (
                        <div key={title} onClick={onClick} style={{
                            background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
                            padding: '24px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }} className="action-card">
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${iconColor}33` }}>
                                {icon}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{title}</h4>
                                <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Feed */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--serif)' }}>Recent reflections</h3>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your latest documented thinking</p>
                        </div>
                        <button 
                          onClick={() => router.push('/history')}
                          style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em', fontWeight: 600 }}
                        >
                            VIEW ALL →
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {loading ? (
                            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                                <Loader2 size={24} color="var(--amber)" className="animate-spin" />
                            </div>
                        ) : reflections.length > 0 ? (
                            reflections.map((r: Reflection) => {
                                const typeStyle = TYPE_STYLES[r.type?.toLowerCase()] ?? TYPE_STYLES.lesson;
                                const isPopoverOpen = popoverEntryId === r.id;
                                return (
                                    <div key={r.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                        transition: 'background 0.15s', gap: '16px', position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                                            <span style={{
                                                flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 10,
                                                fontWeight: 600, letterSpacing: '0.06em',
                                                padding: '4px 10px', borderRadius: 6,
                                                background: typeStyle.bg, color: typeStyle.color,
                                                textTransform: 'uppercase'
                                            }}>
                                                {typeStyle.label}
                                            </span>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                                                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                                                    {r.project.name} · {formatDate(r.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              setPopoverEntryId(isPopoverOpen ? null : r.id); 
                                            }}
                                            style={{ 
                                              background: isPopoverOpen ? 'var(--ink)' : 'none', 
                                              border: '1px solid var(--border)', 
                                              color: isPopoverOpen ? '#fff' : 'var(--muted)',
                                              padding: '6px 12px', borderRadius: '8px',
                                              display: 'flex', alignItems: 'center', gap: '6px',
                                              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                              transition: 'all 0.2s'
                                            }}
                                          >
                                            <Bookmark size={14} /> {isPopoverOpen ? 'CLOSE' : 'SAVE'}
                                          </button>
                                          <ArrowUpRight size={16} color="var(--border)" />
                                        </div>

                                        {isPopoverOpen && (
                                          <AddToCollectionPopover 
                                            entryId={r.id} 
                                            onClose={() => setPopoverEntryId(null)} 
                                          />
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', marginBottom: 12 }}>Nothing yet.</p>
                                <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>Create your first project and start logging reflections.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .action-card:hover { transform: translateY(-4px); border-color: var(--ink); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }
            `}</style>
        </AppLayout>
    );
}