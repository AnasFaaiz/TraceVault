"use client";

import {
    Plus, ArrowUpRight, Loader2, TrendingUp, Folder
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';

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
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, r] = await Promise.all([
                    api.get('/projects'), 
                    api.get('/reflections/recent'),
                ]);
                setProjects(p.data);
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

    return (
        <AppLayout title="Engineering Repository" subtitle="Overview">
            {/* Welcome */}
            <div className="fade-up">
                <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 400, color: '#0e0d0b', marginBottom: 4 }}>
                    Welcome back, <em style={{ color: 'var(--amber)' }}>{user.name.split(' ')[0]}</em>
                </p>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Ready to document today&apos;s engineering decisions?
                </p>
            </div>

            {/* Stats row */}
            <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                    { label: 'Projects', value: projects.length, note: 'active' },
                    { label: 'Reflections', value: reflections.length, note: 'recent' },
                    {
                        label: 'This month', value: reflections.filter(r => {
                            const d = new Date(r.createdAt);
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length, note: 'entries'
                    },
                ].map(({ label, value, note }) => (
                    <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
                        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, fontWeight: 400, color: '#0e0d0b', lineHeight: 1 }}>{loading ? '—' : value}</p>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{note}</p>
                    </div>
                ))}
            </div>

            {/* Action cards etc ... */}
            <div className="fade-up fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                    {
                        icon: <Plus size={18} />,
                        iconBg: '#fdf6e8', iconColor: '#c8852a',
                        title: 'New reflection',
                        desc: 'Document a design decision, tradeoff, or lesson learned.',
                    },
                    {
                        icon: <Folder size={18} />,
                        iconBg: '#edf7f4', iconColor: '#2a6b5e',
                        title: 'Browse projects',
                        desc: `You have ${projects.length} project${projects.length !== 1 ? 's' : ''} with logged reflections.`,
                    },
                    {
                        icon: <TrendingUp size={18} />,
                        iconBg: '#f0f0f8', iconColor: '#4a4a8a',
                        title: 'Review growth',
                        desc: 'See how your engineering thinking has evolved over time.',
                    },
                ].map(({ icon, iconBg, iconColor, title, desc }) => (
                    <div key={title} style={{
                        background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                        padding: '22px', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s',
                        display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${iconColor}33` }}>
                            {icon}
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 500, color: '#0e0d0b', marginTop: 4 }}>{title}</h4>
                        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                ))}
            </div>

            <div className="fade-up fade-up-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 500, color: '#0e0d0b' }}>Recent reflections</h3>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Your latest documented thinking</p>
                    </div>
                    <button style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
                        View all →
                    </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '0 20px' }}>
                    {loading ? (
                        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                            <Loader2 size={20} color="var(--amber)" className="animate-spin" />
                        </div>
                    ) : reflections.length > 0 ? (
                        reflections.map((r) => {
                            const typeStyle = TYPE_STYLES[r.type?.toLowerCase()] ?? TYPE_STYLES.lesson;
                            return (
                                <div key={r.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                    transition: 'background 0.15s', gap: '16px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                        <span style={{
                                            flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 10,
                                            fontWeight: 500, letterSpacing: '0.06em',
                                            padding: '3px 8px', borderRadius: 4,
                                            background: typeStyle.bg, color: typeStyle.color,
                                        }}>
                                            {typeStyle.label}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: 14, fontWeight: 400, color: '#0e0d0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                                {r.project.name} · {formatDate(r.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={15} color="var(--border)" />
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                            <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, fontStyle: 'italic', marginBottom: 8 }}>Nothing yet.</p>
                            <p style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6 }}>Create your first project and start logging reflections.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}