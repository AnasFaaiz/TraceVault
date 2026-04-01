"use client";

import {
    Terminal, Layout, Folder, History, LogOut,
    Settings, Globe, Loader2, Archive
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useReflectionModal } from '@/store/useReflectionModal';
import NewReflectionModal from './NewReflectionModal';
import GlobalSearchBar from './GlobalSearchBar';

interface AppLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    projectId?: string;
    onReflectionCreated?: () => void;
    headerActions?: React.ReactNode;
    headerLeftContent?: React.ReactNode;
}

interface SearchQuerySyncProps {
    pathname: string;
    onQuerySync: (query: string) => void;
}

function SearchQuerySync({ pathname, onQuerySync }: SearchQuerySyncProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const draftValue = searchParams.get('q_draft');
        const committedValue = searchParams.get('q') ?? '';

        if (draftValue) {
            onQuerySync(draftValue);

            const params = new URLSearchParams(searchParams.toString());
            params.delete('q_draft');
            const queryString = params.toString();

            router.replace(queryString ? `${pathname}?${queryString}` : pathname);
            return;
        }

        onQuerySync(committedValue);
    }, [searchParams, router, pathname, onQuerySync]);

    return null;
}

export default function AppLayout({ children, title, subtitle, projectId: preSelectedProjectId, onReflectionCreated, headerActions, headerLeftContent }: AppLayoutProps) {
    const { user, logout, token, _hasHydrated } = useAuthStore();
    const { isOpen, close, projectId: modalProjectId, initialData } = useReflectionModal();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const isSidebarOpen = isSidebarHovered;
    const isVaultPage = pathname.startsWith('/vault');
    const isFeedPage = pathname.startsWith('/feed');
    const searchTargetPath = isVaultPage ? '/vault' : '/feed';
    const searchPlaceholder = isVaultPage
        ? 'Search your Vault... (Title, Content)'
        : isFeedPage
            ? 'Search the Feed... (Title, Tags, Author)'
            : 'Search reflections...';
    useEffect(() => {
        if (!_hasHydrated) return;
        if (!token) { router.push('/login'); }
    }, [token, router, _hasHydrated]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const value = searchQuery.trim();
        if (!value) return;

        const params = (isFeedPage || isVaultPage)
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

        params.set('q', value);
        params.delete('q_draft');
        router.push(`${searchTargetPath}?${params.toString()}`);
    };

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
        { id: 'dashboard', icon: <Layout size={16} />, label: 'Dashboard', href: '/dashboard' },
        { id: 'projects', icon: <Folder size={16} />, label: 'My Projects', href: '/projects' },
        { id: 'vault', icon: <Archive size={16} />, label: 'Vault', href: '/vault' },
        { id: 'reflections', icon: <History size={16} />, label: 'History', href: '/history' },
        { id: 'settings', icon: <Settings size={16} />, label: 'Settings', href: '/settings' },
    ];

    return (
        <div style={{ position: 'relative', height: '100vh', fontFamily: "'Geist', system-ui, sans-serif", background: '#f5f2eb', overflow: 'hidden' }}>
            <Suspense fallback={null}>
                <SearchQuerySync pathname={pathname} onQuerySync={setSearchQuery} />
            </Suspense>
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
                    <Link
                        href={`/u/${user.username}`}
                        title="View profile"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                            gap: 10,
                            marginBottom: 12,
                            padding: isSidebarOpen ? '0' : '2px 0',
                            borderRadius: 8,
                            textDecoration: 'none',
                        }}
                    >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0e0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: '#f5f2eb', fontWeight: 500, flexShrink: 0 }}>
                            {initials}
                        </div>
                        {isSidebarOpen && (
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#0e0d0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>Engineer</p>
                            </div>
                        )}
                    </Link>
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
            <main
                aria-label={`${title} ${subtitle}`}
                style={{ marginLeft: 70, width: 'calc(100% - 70px)', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >
                <div style={{ padding: '14px 28px 24px', display: 'flex', justifyContent: headerLeftContent ? 'space-between' : 'flex-end', alignItems: 'flex-end', gap: 16 }}>
                    {headerLeftContent && (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-start', paddingLeft: 156 }}>
                            {headerLeftContent}
                        </div>
                    )}
                    <div style={{ width: '36%', minWidth: 420, maxWidth: 560, flexShrink: 0 }}>
                        <GlobalSearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSubmit={handleSearch}
                            placeholder={searchPlaceholder}
                            rightActions={headerActions}
                        />
                    </div>
                </div>

                <div style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
