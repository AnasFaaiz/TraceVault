"use client";

import {
    Terminal, Layout, Folder, History, LogOut,
    Settings, Plus, Globe, Loader2, Search, Archive
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReflectionModal } from '@/store/useReflectionModal';
import NewReflectionModal from './NewReflectionModal';

interface AppLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    projectId?: string;
    onReflectionCreated?: () => void;
    headerActions?: React.ReactNode;
}

export default function AppLayout({ children, title, subtitle, projectId: preSelectedProjectId, onReflectionCreated, headerActions }: AppLayoutProps) {
    const { user, logout, token, _hasHydrated } = useAuthStore();
    const { isOpen, close, open, projectId: modalProjectId, initialData } = useReflectionModal();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement | null>(null);
    const isSidebarOpen = isSidebarHovered;
    const isVaultPage = pathname.startsWith('/vault');
    const isFeedPage = pathname.startsWith('/feed');
    const searchTargetPath = isVaultPage ? '/vault' : '/feed';
    const searchPlaceholder = isVaultPage
        ? 'Search your Vault... (Title, Content)'
        : isFeedPage
            ? 'Search the Feed... (Title, Tags, Author)'
            : 'Search reflections...';
    const modifierKey =
        typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
            ? '⌘'
            : 'Ctrl';

    useEffect(() => {
        if (!_hasHydrated) return;
        if (!token) { router.push('/login'); }
    }, [token, router, _hasHydrated]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`${searchTargetPath}?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                addMenuRef.current &&
                !addMenuRef.current.contains(event.target as Node)
            ) {
                setIsAddMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        setIsAddMenuOpen(false);
    }, [pathname]);

    if (!_hasHydrated || (token && !user)) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f2eb' }}>
                <Loader2 className="animate-spin" size={32} color="#c8852a" />
            </div>
        );
    }

    if (!user) return null;

    const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    const navItems = [
        { id: 'feed', icon: <Globe size={16} />, label: 'Community Feed', href: '/feed' },
        { id: 'dashboard', icon: <Layout size={16} />, label: 'Personal Dashboard', href: '/dashboard' },
        { id: 'projects', icon: <Folder size={16} />, label: 'My Projects', href: '/projects' },
        { id: 'vault', icon: <Archive size={16} />, label: 'Vault', href: '/vault' },
        { id: 'reflections', icon: <History size={16} />, label: 'History', href: '/history' },
        { id: 'settings', icon: <Settings size={16} />, label: 'Settings', href: '/settings' },
    ];

    return (
        <div style={{ position: 'relative', height: '100vh', fontFamily: "'Geist', system-ui, sans-serif", background: '#f5f2eb', overflow: 'hidden' }}>
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
          text-align: left; letter-spacing: 0.02em; text-decoration: none;
        }
        .nav-btn:hover { background: #e8e4db; color: var(--ink); }
        .nav-btn.active { background: #fff; color: var(--ink); font-weight: 500; border: 1px solid var(--border); }
        
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
                width: isSidebarOpen ? 220 : 70, background: '#ece8df',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                padding: isSidebarOpen ? '24px 16px' : '24px 10px',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 40,
                transition: 'width 0.2s ease, padding 0.2s ease',
                overflow: 'hidden',
            }}
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
            >
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 36, paddingLeft: isSidebarOpen ? 4 : 0, justifyContent: isSidebarOpen ? 'flex-start' : 'center', textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, background: '#0e0d0b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal size={14} color="#f5f2eb" />
                    </div>
                    {isSidebarOpen && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, color: '#0e0d0b', letterSpacing: '-0.01em' }}>TraceVault</span>
                    )}
                </Link>

                {/* Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    {navItems.map(item => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`nav-btn ${pathname === item.href ? 'active' : ''}`}
                            title={item.label}
                            style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '9px 14px' : '9px 10px' }}
                        >
                            {item.icon}
                            {isSidebarOpen && item.label}
                        </Link>
                    ))}
                </nav>

                {/* User + logout */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0e0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: '#f5f2eb', fontWeight: 500, flexShrink: 0 }}>
                            {initials}
                        </div>
                        {isSidebarOpen && (
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#0e0d0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>Engineer</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={logout}
                        title="Sign out"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: 8, padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', borderRadius: 6, transition: 'color 0.15s', letterSpacing: '0.04em' }}
                    >
                        <LogOut size={12} /> {isSidebarOpen && 'Sign out'}
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main style={{ marginLeft: 70, width: 'calc(100% - 70px)', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <header style={{ padding: '16px 36px', borderBottom: '1px solid var(--border)', background: '#f5f2eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 40, flex: 1 }}>
                        <div>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{subtitle}</p>
                            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#0e0d0b', whiteSpace: 'nowrap' }}>
                                {title}
                            </h1>
                        </div>

                        {/* Global Search Bar */}
                        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
                            <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                style={{
                                    width: '100%', padding: '10px 14px 10px 40px',
                                    borderRadius: 10, border: '1px solid var(--border)',
                                    background: 'var(--paper-dark)', fontSize: 13,
                                    outline: 'none', transition: 'all 0.2s',
                                    fontFamily: 'var(--mono)'
                                }}
                                onFocus={(e) => e.target.style.background = '#fff'}
                                onBlur={(e) => e.target.style.background = 'var(--paper-dark)'}
                            />
                            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                                <span style={{ padding: '2px 6px', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{modifierKey}</span>
                                <span style={{ padding: '2px 6px', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>K</span>
                            </div>
                        </form>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 24, flexShrink: 0 }}>
                        {headerActions}

                        <div ref={addMenuRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setIsAddMenuOpen((prev) => !prev)}
                            aria-label="Add options"
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#0e0d0b',
                                color: '#f5f2eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.2s',
                            }}
                        >
                            <Plus size={16} />
                        </button>

                        {isAddMenuOpen && (
                            <div style={{
                                position: 'absolute', right: 0, top: 46,
                                width: 180, background: '#fff', border: '1px solid var(--border)',
                                borderRadius: 10, boxShadow: '0 8px 24px rgba(14,13,11,0.12)',
                                padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddMenuOpen(false);
                                        open(preSelectedProjectId);
                                    }}
                                    style={{
                                        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                                        background: 'transparent', borderRadius: 8, padding: '9px 10px',
                                        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)',
                                    }}
                                >
                                    + New reflection
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddMenuOpen(false);
                                        router.push('/projects?create=1');
                                    }}
                                    style={{
                                        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                                        background: 'transparent', borderRadius: 8, padding: '9px 10px',
                                        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)',
                                    }}
                                >
                                    + New project
                                </button>
                            </div>
                        )}
                        </div>
                    </div>
                </header>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {children}
                </div>
            </main>

            <NewReflectionModal 
                isOpen={isOpen} 
                onClose={close} 
                preSelectedProjectId={modalProjectId || preSelectedProjectId}
                initialData={initialData}
                onSuccess={onReflectionCreated}
            />
        </div>
    );
}
