"use client";

import { Folder, Plus, Trash2, FileText, Loader2, ArrowUpRight, Github, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';

interface Project {
    id: string;
    name: string;
    description?: string;
    techStack?: string[];
    createdAt: string;
    _count: { reflections: number };
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [githubUrl, setGithubUrl] = useState('');
    const [newProject, setNewProject] = useState({ name: '', description: '', techStack: '' });
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImportGithub = async () => {
        if (!githubUrl) return;
        setIsImporting(true);
        try {
            // Simplified parsing for owner/repo
            const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) throw new Error('Invalid GitHub URL');
            const [, owner, repo] = match;

            const [repoRes, langRes, readmeRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}`).then(res => res.json()),
                fetch(`https://api.github.com/repos/${owner}/${repo}/languages`).then(res => res.json()),
                fetch(`https://api.github.com/repos/${owner}/${repo}/readme`).then(res => res.json()).catch(() => null)
            ]);

            let readmeText = '';
            if (readmeRes && readmeRes.content) {
                try {
                    // GitHub returns base64, must handle potential non-latin characters
                    const base64 = readmeRes.content.replace(/\s/g, '');
                    readmeText = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                } catch (e) {
                    console.error('Failed to decode README', e);
                    readmeText = repoRes.description || '';
                }
            }

            setNewProject({
                name: repoRes.name || '',
                description: readmeText.split('\n').slice(0, 50).join('\n') || repoRes.description || '', // Use first 50 lines to keep it manageable
                techStack: Object.keys(langRes).join(', ')
            });
            setIsCreating(true);
        } catch (err) {
            console.error('Failed to import from GitHub', err);
            alert('Could not fetch repository info. Please check the URL.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This will permanently erase ALL reflections in this vault.`)) return;
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err) {
            console.error('Failed to delete project', err);
            alert('Failed to delete project.');
        }
    };

    const handleEditProject = (project: Project) => {
        setNewProject({
            name: project.name,
            description: project.description || '',
            techStack: project.techStack?.join(', ') || ''
        });
        setEditingProjectId(project.id);
        setIsCreating(true);
        setGithubUrl('');
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...newProject,
                techStack: newProject.techStack.split(',').map(t => t.trim()).filter(t => t !== ''),
            };

            if (editingProjectId) {
                await api.patch(`/projects/${editingProjectId}`, data);
            } else {
                await api.post('/projects', data);
            }

            setIsCreating(false);
            setEditingProjectId(null);
            setNewProject({ name: '', description: '', techStack: '' });
            fetchProjects();
        } catch (err) {
            console.error('Failed to save project', err);
        }
    };

    return (
        <AppLayout title="Project Repository" subtitle="/projects">
            <div className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--ink)' }}>Engineering <em style={{ color: 'var(--amber)' }}>Vaults</em></p>
                        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>Manage the technical projects you&apos;re tracking.</p>
                    </div>
                    <button 
                        onClick={() => { setIsCreating(true); setGithubUrl(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        <Plus size={16} /> New Project
                    </button>
                </div>

                {isCreating && (
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 32, marginBottom: 32, animation: 'fadeUp 0.3s ease both', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--serif)' }}>
                                {editingProjectId ? 'Update Project Scope' : 'Initialize New Project Vault'}
                            </h3>
                            <button onClick={() => { setIsCreating(false); setEditingProjectId(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--mono)' }}>Close</button>
                        </div>

                        {/* GitHub Import Section */}
                        <div style={{ background: 'var(--paper)', borderRadius: 8, padding: 20, border: '1px dashed var(--border)', marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <Github size={18} color="var(--ink)" />
                                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Import from GitHub</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <input 
                                    value={githubUrl}
                                    onChange={e => setGithubUrl(e.target.value)}
                                    placeholder="Paste repository URL (e.g. github.com/user/repo)" 
                                    style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }}
                                />
                                <button 
                                    onClick={handleImportGithub}
                                    disabled={isImporting}
                                    style={{ background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 6, padding: '0 20px', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {isImporting ? <Loader2 size={14} className="animate-spin" /> : 'Fetch Meta'}
                                </button>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, fontStyle: 'italic' }}>This will automatically populate the fields below.</p>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: 28 }}></div>

                        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Project Name</label>
                                    <input 
                                        required
                                        value={newProject.name}
                                        onChange={e => setNewProject({...newProject, name: e.target.value})}
                                        placeholder="Project handle..." 
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--paper)', fontSize: 14, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Tech Stack Tags</label>
                                    <input 
                                        value={newProject.techStack}
                                        onChange={e => setNewProject({...newProject, techStack: e.target.value})}
                                        placeholder="Comma-separated tools..." 
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--paper)', fontSize: 14, outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Project Description</label>
                                <textarea 
                                    value={newProject.description}
                                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                                    placeholder="The technical scope and objectives..." 
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--paper)', fontSize: 14, minHeight: 100, resize: 'vertical', outline: 'none' }}
                                />
                            </div>
                            <button type="submit" style={{ padding: '14px', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 12, transition: 'background 0.2s' }}>
                                {editingProjectId ? 'Update Archive Metadata' : 'Initialize Project Archive'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <Loader2 size={32} className="animate-spin" color="var(--amber)" />
                        </div>
                    ) : projects.length > 0 ? (
                        projects.map(project => (
                            <div key={project.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--paper-dark)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
                                        <Folder size={20} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button 
                                            onClick={() => handleEditProject(project)}
                                            style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                                            <Pencil size={12} />
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', background: 'var(--paper)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                                            <FileText size={10} /> {project._count.reflections}
                                        </div>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>{project.name}</h3>
                                {project.description && (
                                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {project.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', marginBottom: 20 }}>
                                    {project.techStack?.map(tech => (
                                        <span key={tech} style={{ fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 6px', background: 'var(--paper-dark)', borderRadius: 4, color: 'var(--muted)' }}>
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button 
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                        style={{ flex: 1, padding: '12px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}>
                                        View Reflections <ArrowUpRight size={15} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteProject(project.id, project.name)}
                                        style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--rust)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dotted var(--border)' }}>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 24, fontStyle: 'italic', marginBottom: 12 }}>No projects founded.</p>
                            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Start by creating your first project to track engineering growth.</p>
                            <button 
                                onClick={() => setIsCreating(true)}
                                style={{ padding: '12px 24px', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                                Initialize My First Vault
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
