"use client";

import {
    Terminal, LogOut, Layout, Folder, History,
    Settings, Plus, ArrowUpRight, Loader2, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

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
    const { user, logout, token, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState('overview');

    useEffect(() => {
        if (!_hasHydrated) return;
        if (!token) { router.push('/login'); return; }
        const fetchData = async () => {
            try {
                const [p, r] = await Promise.all([api.get('/projects'), api.get('/reflections/recent')]);
                setProjects(p.data);
                setReflections(r.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, router, _hasHydrated]);

    if (!_hasHydrated || (token && !user)) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f2eb' }}>
                <Loader2 className="animate-spin" size={32} color="#c8852a" />
            </div>
        );
    }

    if (!user) return null;

    const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    const formatDate = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const navItems = [
        { id: 'overview', icon: <Layout size={16} />, label: 'Overview' },
        { id: 'projects', icon: <Folder size={16} />, label: 'Projects' },
        { id: 'reflections', icon: <History size={16} />, label: 'Reflections' },
        { id: 'settings', icon: <Settings size={16} />, label: 'Settings' },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: "'Geist', system-ui, sans-serif", background: '#f5f2eb', overflow: 'hidden' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --ink: #0e0d0b; --paper: #f5f2eb; --paper-dark: #ece8df;
          --amber: #c8852a; --teal: #2a6b5e; --rust: #8b3e2a;
          --muted: #6b6760; --border: #d4cfc4;
          --serif: 'Instrument Serif', Georgia, serif;
          --mono: 'DM Mono', monospace;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; border-radius: 8px; border: none;
          background: transparent; cursor: pointer; font-family: var(--mono);
          font-size: 12px; color: var(--muted); transition: all 0.15s;
          text-align: left; letter-spacing: 0.02em;
        }
        .nav-btn:hover { background: #e8e4db; color: var(--ink); }
        .nav-btn.active { background: #fff; color: var(--ink); font-weight: 500; border: 1px solid var(--border); }
        .action-card {
          background: #fff; border: 1px solid var(--border); border-radius: 10px;
          padding: 22px; cursor: pointer; transition: box-shadow 0.2s, transform 0.15s;
          display: flex; flex-direction: column; gap: 10px;
        }
        .action-card:hover { box-shadow: 0 4px 20px rgba(14,13,11,0.08); transform: translateY(-2px); }
        .feed-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid var(--border); cursor: pointer;
          transition: background 0.15s; gap: 16px;
        }
        .feed-item:last-child { border-bottom: none; }
        .feed-item:hover .feed-arrow { color: var(--amber); }
        .feed-arrow { color: var(--border); transition: color 0.15s; flex-shrink: 0; }
        .stat-card {
          background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 20px 22px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.1s; }
        .fade-up-3 { animation-delay: 0.15s; }
      `}</style>

            {/* ── Sidebar ── */}
            <aside style={{
                width: 220, flexShrink: 0, background: '#ece8df',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                padding: '24px 16px',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 36, paddingLeft: 4 }}>
                    <div style={{ width: 28, height: 28, background: '#0e0d0b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal size={14} color="#f5f2eb" />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, color: '#0e0d0b', letterSpacing: '-0.01em' }}>TraceVault</span>
                </div>

                {/* Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-btn ${activeNav === item.id ? 'active' : ''}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* User + logout */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0e0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: '#f5f2eb', fontWeight: 500, flexShrink: 0 }}>
                            {initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0e0d0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>Engineer</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', borderRadius: 6, transition: 'color 0.15s', letterSpacing: '0.04em' }}
                    >
                        <LogOut size={12} /> Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <header style={{ padding: '20px 36px', borderBottom: '1px solid var(--border)', background: '#f5f2eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Overview</p>
                        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#0e0d0b' }}>Engineering Repository</h1>
                    </div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#0e0d0b', color: '#f5f2eb', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.01em', transition: 'background 0.2s' }}>
                        <Plus size={14} /> New reflection
                    </button>
                </header>

                <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 32 }}>
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
                            <div key={label} className="stat-card">
                                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
                                <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, fontWeight: 400, color: '#0e0d0b', lineHeight: 1 }}>{loading ? '—' : value}</p>
                                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{note}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action cards */}
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
                            <div key={title} className="action-card">
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${iconColor}33` }}>
                                    {icon}
                                </div>
                                <h4 style={{ fontSize: 14, fontWeight: 500, color: '#0e0d0b', marginTop: 4 }}>{title}</h4>
                                <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Recent reflections */}
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
                                    <Loader2 size={20} color="var(--amber)" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : reflections.length > 0 ? (
                                reflections.map((r) => {
                                    const typeStyle = TYPE_STYLES[r.type?.toLowerCase()] ?? TYPE_STYLES.lesson;
                                    return (
                                        <div key={r.id} className="feed-item">
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
                                            <ArrowUpRight size={15} className="feed-arrow" />
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
                </div>
            </main>
        </div>
    );
}