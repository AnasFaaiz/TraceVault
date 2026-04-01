"use client";

import { Loader2, Github, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';
import ProjectCard from './_components/ProjectCard';
import { SortOption, FilterOption } from './_components/SortFilterBar';
import EmptyStates from './_components/EmptyStates';
import CollectionRow from './_components/CollectionRow';
import NewCollectionModal from './_components/NewCollectionModal';

interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    lastActivityAt: string | null;
    entryCount: number;
    templateBreakdown: { template_type: string; count: number }[];
    topTags: string[];
    impactSummary: {
      pivotalCount: number;
      significantCount: number;
      minorCount: number;
    };
    techStack?: string[];
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  visibility: 'private' | 'public';
  entryCount: number;
  updatedAt: string;
  relativeDate: string;
  previewTitles: string[];
}

import Toast, { ToastType } from '@/components/Toast';

function ProjectsPageContent() {
  const PROJECT_SKELETON_COUNT = 6;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<Project[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
      setToast({ message, type });
    };
    
    // Project CRUD state
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [newProject, setNewProject] = useState({ name: '', description: '', techStack: '' });
    const [isImporting, setIsImporting] = useState(false);
    const [githubUrl, setGithubUrl] = useState('');

    // Collection CRUD state
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

    // Filter and Sort state for projects
    const [sort, setSort] = useState<SortOption>('recent');
    const [filter, setFilter] = useState<FilterOption>('all');
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const headerMenuRef = useRef<HTMLDivElement>(null);

    const SORT_LABELS: Record<SortOption, string> = {
      recent: 'Most Recent',
      oldest: 'Oldest First',
      active: 'Most Active',
      alpha: 'Alphabetical',
    };

    const FILTER_LABELS: Record<FilterOption, string> = {
      all: 'All',
      pivotal: 'Has Pivotal entries',
      recent_active: 'Active this month',
      empty: 'No entries yet',
    };

    useEffect(() => {
        const loadData = async () => {
          try {
            const [pRes, cRes] = await Promise.all([
              api.get('/projects'),
              api.get('/collections')
            ]);
            setProjects(pRes.data.projects);
            setCollections(cRes.data.collections);
          } catch (err) {
            console.error('Failed to load projects/collections', err);
          } finally {
            setLoading(false);
          }
        };
        loadData();
    }, []);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
          setHeaderMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Create from search param
    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setIsCreatingProject(true);
            setEditingProjectId(null);
            setGithubUrl('');
        }
    }, [searchParams]);

    // Keyboard shortcut N
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'n' && !isCreatingProject && !isCreatingCollection && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                setIsCreatingProject(true);
                setEditingProjectId(null);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isCreatingProject, isCreatingCollection]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data.projects);
        } catch (err) { console.error(err); }
    };

    const fetchCollections = async () => {
      try {
          const response = await api.get('/collections');
          setCollections(response.data.collections);
      } catch (err) { console.error(err); }
    };

    const handleImportGithub = async () => {
        if (!githubUrl) return;
        setIsImporting(true);
        try {
            const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) throw new Error('Invalid GitHub URL');
            const [, owner, repo] = match;

            const [repoRes, langRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}`).then(res => res.json()),
                fetch(`https://api.github.com/repos/${owner}/${repo}/languages`).then(res => res.json()),
            ]);

            setNewProject({
                name: repoRes.name || '',
                description: repoRes.description || '',
                techStack: Object.keys(langRes).join(', ')
            });
            setIsCreatingProject(true);
        } catch (err) {
            console.error('Failed to import from GitHub', err);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        if (!confirm(`Permanently erase ALL reflections in "${name}"?`)) return;
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err) { console.error(err); }
    };

    const handleEditProject = (project: Project) => {
        setNewProject({
            name: project.name,
            description: project.description || '',
            techStack: project.techStack?.join(', ') || ''
        });
        setEditingProjectId(project.id);
        setIsCreatingProject(true);
    };

    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...newProject,
                techStack: newProject.techStack.split(',').map(t => t.trim()).filter(t => t !== ''),
            };
            if (editingProjectId) await api.patch(`/projects/${editingProjectId}`, data);
            else await api.post('/projects', data);
            setIsCreatingProject(false);
            setEditingProjectId(null);
            showToast('Saved successfully');
            fetchProjects();
        } catch (err) { console.error(err); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveCollection = async (data: any) => {
      try {
        if (editingCollection) await api.patch(`/collections/${editingCollection.id}`, data);
        else await api.post('/collections', data);
        showToast('Saved successfully');
        fetchCollections();
      } catch (err) { console.error(err); }
    };

    const handleDeleteCollection = async (id: string, name: string) => {
      if (!confirm(`Delete collection "${name}"? entries will not be deleted.`)) return;
      try {
        await api.delete(`/collections/${id}`);
        fetchCollections();
      } catch (err) { console.error(err); }
    };

    // Client-side Sorting and Filtering for Projects
    const processedProjects = useMemo(() => {
        let filtered = [...projects];
        if (filter === 'pivotal') filtered = filtered.filter(p => p.impactSummary.pivotalCount > 0);
        else if (filter === 'recent_active') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filtered = filtered.filter(p => p.lastActivityAt && new Date(p.lastActivityAt) > thirtyDaysAgo);
        } 
        else if (filter === 'empty') filtered = filtered.filter(p => p.entryCount === 0);

        const sortMap: Record<SortOption, (a: Project, b: Project) => number> = {
          recent: (a, b) => (b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0) - (a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0),
          oldest: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          active: (a, b) => b.entryCount - a.entryCount,
          alpha: (a, b) => a.name.localeCompare(b.name)
        };
        return filtered.sort(sortMap[sort]);
    }, [projects, sort, filter]);

    const headerActions = (
      <div ref={headerMenuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setHeaderMenuOpen(v => !v)}
          aria-label="Open sort and filter options"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${filter !== 'all' || sort !== 'recent' ? 'var(--amber)' : 'var(--border)'}`,
            background: '#fff',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: filter !== 'all' || sort !== 'recent' ? '0 0 0 1px var(--amber)' : 'none',
          }}
        >
          <SlidersHorizontal size={14} />
        </button>

        {headerMenuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 260,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              padding: 10,
              zIndex: 1000,
            }}
          >
            <div style={{ padding: '6px 8px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
              Filter
            </div>
            {Object.entries(FILTER_LABELS).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onSelectFilter(val as FilterOption)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 10px',
                  background: filter === val ? 'var(--paper)' : 'transparent',
                  color: filter === val ? 'var(--amber)' : 'var(--muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {label}
                {filter === val && <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

            <div style={{ padding: '6px 8px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
              Sort
            </div>
            {Object.entries(SORT_LABELS).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onSelectSort(val as SortOption)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 10px',
                  background: sort === val ? 'var(--paper)' : 'transparent',
                  color: sort === val ? 'var(--amber)' : 'var(--muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {label}
                {sort === val && <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />}
              </button>
            ))}

            {(filter !== 'all' || sort !== 'recent') && (
              <button
                type="button"
                onClick={() => {
                  setSort('recent');
                  setFilter('all');
                  setHeaderMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  marginTop: 8,
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 10px',
                  background: 'var(--paper)',
                  color: 'var(--muted)',
                  fontSize: 12,
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>
    );

    const onSelectFilter = (val: FilterOption) => {
      setFilter(val);
      setHeaderMenuOpen(false);
    };

    const onSelectSort = (val: SortOption) => {
      setSort(val);
      setHeaderMenuOpen(false);
    };

    return (
        <AppLayout title="Projects" subtitle="Your Engineering Workspaces" headerActions={headerActions}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0 100px' }}>
                
                {/* SECTION 1: PROJECTS */}
                <section style={{ marginBottom: '80px' }}>
                    <div style={{ height: '1px', background: 'var(--border)', width: '100%', marginBottom: '32px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                      <h2 style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                        PROJECTS ({projects.length})
                      </h2>
                      <button
                        onClick={() => { setIsCreatingProject(true); setEditingProjectId(null); }}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
                        className="ghost-btn"
                      >
                        + New Project
                      </button>
                    </div>

                    {isCreatingProject && (
                        <div style={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 24, padding: '40px', marginBottom: 48, animation: 'fadeUp 0.4s ease both', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <h3 style={{ fontSize: 24, fontWeight: 500, fontFamily: 'var(--serif)' }}>{editingProjectId ? 'Update Project Archive' : 'New Project Vault'}</h3>
                                <button onClick={() => setIsCreatingProject(false)} style={{ background: 'var(--paper)', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--mono)', padding: '6px 12px', borderRadius: '6px' }}>CLOSE</button>
                            </div>
                            
                            {!editingProjectId && (
                              <div style={{ background: 'var(--paper)', borderRadius: 12, padding: 24, border: '1px dashed var(--border)', marginBottom: 32 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                      <Github size={18} /> <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)' }}>IMPORT METADATA FROM GITHUB</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 12 }}>
                                      <input 
                                          value={githubUrl}
                                          onChange={e => setGithubUrl(e.target.value)}
                                          placeholder="github.com/user/repo" 
                                          style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                                      />
                                      <button onClick={handleImportGithub} disabled={isImporting} style={{ background: 'var(--ink)', color: '#fff', padding: '0 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                          {isImporting ? <Loader2 size={16} className="animate-spin" /> : 'Fetch'}
                                      </button>
                                  </div>
                              </div>
                            )}

                            <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>HANDLE</label>
                                        <input required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--paper)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>STACK (COMMA SEPARATED)</label>
                                        <input value={newProject.techStack} onChange={e => setNewProject({...newProject, techStack: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--paper)' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>SCOPE / DESCRIPTION</label>
                                    <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--paper)', minHeight: 120 }} />
                                </div>
                                <button type="submit" style={{ padding: '16px', background: 'var(--ink)', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                                    {editingProjectId ? 'Save Changes' : 'Initialize Vault'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
                        {loading ? (
                            Array.from({ length: PROJECT_SKELETON_COUNT }).map((_, i) => (
                              <div
                                key={`project-skeleton-${i}`}
                                style={{
                                  border: '1px solid var(--border)',
                                  borderRadius: '18px',
                                  padding: '22px',
                                  background: '#fff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '12px',
                                }}
                                aria-hidden="true"
                              >
                                <div className="skeleton" style={{ width: '58%', height: '18px', borderRadius: '8px' }} />
                                <div className="skeleton" style={{ width: '92%', height: '12px', borderRadius: '8px' }} />
                                <div className="skeleton" style={{ width: '80%', height: '12px', borderRadius: '8px', marginBottom: '8px' }} />
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                  <div className="skeleton" style={{ width: '64px', height: '24px', borderRadius: '999px' }} />
                                  <div className="skeleton" style={{ width: '82px', height: '24px', borderRadius: '999px' }} />
                                  <div className="skeleton" style={{ width: '56px', height: '24px', borderRadius: '999px' }} />
                                </div>
                                <div className="skeleton" style={{ width: '100%', height: '1px', borderRadius: 0, marginBottom: '8px' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <div className="skeleton" style={{ width: '34%', height: '11px', borderRadius: '6px' }} />
                                  <div className="skeleton" style={{ width: '26%', height: '11px', borderRadius: '6px' }} />
                                </div>
                              </div>
                            ))
                        ) : projects.length === 0 ? (
                            <div style={{ gridColumn: '1/-1' }}><EmptyStates type="no-projects" onAction={() => setIsCreatingProject(true)} /></div>
                        ) : processedProjects.length === 0 ? (
                            <div style={{ gridColumn: '1/-1' }}><EmptyStates type="no-results" onClear={() => setFilter('all')} /></div>
                        ) : (
                          processedProjects.map(p => (
                            <ProjectCard key={p.id} project={p} onEdit={() => handleEditProject(p)} onDelete={handleDeleteProject} onView={id => router.push(`/projects/${id}`)} />
                          ))
                        )}
                    </div>
                </section>

                <div style={{ height: '1px', background: 'var(--border)', width: '100%', marginBottom: '64px' }} />

                {/* SECTION 3: COLLECTIONS */}
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                        COLLECTIONS ({collections.length})
                    </h2>
                    <button 
                        onClick={() => { setIsCreatingCollection(true); setEditingCollection(null); }}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
                        className="ghost-btn"
                    >
                        + New Collection
                    </button>
                  </div>

                  {collections.length === 0 ? (
                    <div style={{ padding: '40px 0', border: '1px dashed var(--border)', borderRadius: '16px', textAlign: 'left', paddingLeft: '40px', background: 'rgba(255,255,255,0.4)' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>No collections yet</p>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px', lineHeight: 1.6 }}>Group entries from any project into curated collections — like a reading list for your engineering knowledge.</p>
                      <button onClick={() => setIsCreatingCollection(true)} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>+ New Collection</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {collections.map(c => (
                        <CollectionRow 
                          key={c.id} collection={c} 
                          onEdit={() => { setEditingCollection(c); setIsCreatingCollection(true); }} 
                          onDelete={handleDeleteCollection} 
                          onView={id => router.push(`/collections/${id}`)} 
                        />
                      ))}
                    </div>
                  )}
                </section>

                {isCreatingCollection && (
                  <NewCollectionModal 
                    onClose={() => { setIsCreatingCollection(false); setEditingCollection(null); }}
                    onSave={handleSaveCollection}
                    isEditing={!!editingCollection}
                    initialData={editingCollection ? { name: editingCollection.name, description: editingCollection.description || '', visibility: editingCollection.visibility } : undefined}
                  />
                )}

                {toast && (
                  <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                  />
                )}
            </div>
            
            <style jsx>{`
              .ghost-btn { cursor: pointer; transition: all 0.2s; }
              .ghost-btn:hover { border-color: var(--ink); background: var(--paper); }
              @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
              .skeleton {
                background: linear-gradient(90deg, #ece8df 25%, #f7f4ee 50%, #ece8df 75%);
                background-size: 200% 100%;
                animation: shimmer 1.4s linear infinite;
              }
              @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </AppLayout>
    );
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<Loader2 className="animate-spin" />}>
            <ProjectsPageContent />
        </Suspense>
    );
}
