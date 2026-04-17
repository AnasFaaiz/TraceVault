"use client";

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Plus, Loader2, 
    FileText, Calendar, Tag, Pencil, Trash2
} from 'lucide-react';
import { useReflectionModal } from '@/store/useReflectionModal';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';

interface Reflection {
    id: string;
    title: string;
    createdAt: string;
    type: string; // legacy
    category: string;
    template_type: string;
    content: string;
    impact: string;
}

interface ProjectData {
    id: string;
    name: string;
    description: string;
    techStack: string[];
    createdAt: string;
    reflections: Reflection[];
    _count: { reflections: number };
}

const TEMPLATE_TABS = [
    { key: 'ALL', label: 'All' },
    { key: 'bug_autopsy', label: 'Bug Autopsy' },
    { key: 'design_decision', label: 'Design Decision' },
    { key: 'tradeoff', label: 'Tradeoff' },
    { key: 'lesson_learned', label: 'Lesson Learned' },
    { key: 'integration_note', label: 'Integration Note' },
    { key: 'technical_challenge', label: 'Technical Challenge' },
];

const TYPE_STYLES: Record<string, { label: string; bg: string; color: string }> = {
        bug_autopsy: { label: 'Bug Autopsy', bg: '#fdf0ea', color: '#8b3e2a' },
        design_decision: { label: 'Design Decision', bg: '#edf7f4', color: '#2a6b5e' },
        tradeoff: { label: 'Tradeoff', bg: '#fdf6e8', color: '#854f0b' },
        lesson_learned: { label: 'Lesson Learned', bg: '#f0f0f8', color: '#4a4a8a' },
        integration_note: { label: 'Integration Note', bg: '#e8f6f7', color: '#2a6b6b' },
        technical_challenge: { label: 'Technical Challenge', bg: '#f0f8fa', color: '#2a4a6b' },
        // fallback
        challenge: { label: 'Challenge', bg: '#fdf0ea', color: '#8b3e2a' },
        decision: { label: 'Decision', bg: '#edf7f4', color: '#2a6b5e' },
        lesson: { label: 'Lesson', bg: '#f0f0f8', color: '#4a4a8a' },
};
    // Template tab state
    const [activeTab, setActiveTab] = useState<string>('ALL');

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const router = useRouter();
    const { open } = useReflectionModal();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProjectDetails = useCallback(async () => {
        try {
            const response = await api.get(`/reflections/project/${projectId}`);
            setProject(response.data);
        } catch (err) {
            console.error('Failed to fetch project details', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    const handleDeleteReflection = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) return;
        try {
            await api.delete(`/reflections/${id}`);
            fetchProjectDetails();
        } catch (err) {
            console.error('Failed to delete reflection', err);
            alert('Failed to delete reflection.');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
    };

    if (loading) {
        return (
            <AppLayout title="Project Vault" subtitle="...">
                <div style={{ padding: 100, display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={32} className="animate-spin" color="var(--amber)" />
                </div>
            </AppLayout>
        );
    }

    if (!project) {
        return (
            <AppLayout title="Project Not Found" subtitle="Error">
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <p>This project vault does not exist or has been archived.</p>
                    <button onClick={() => router.push('/projects')} style={{ marginTop: 20, padding: '10px 20px', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 6 }}>Back to Repository</button>
                </div>
            </AppLayout>
        );
    }

    // Filtering logic
    const getTemplateKey = (r: Reflection) => {
        // Prefer template_type, then category, then type
        return (
            (r.template_type || r.category || r.type || '').toLowerCase()
        );
    };

    const filteredReflections = project.reflections.filter(r => {
        if (activeTab === 'ALL') return true;
        return getTemplateKey(r) === activeTab;
    });

    return (
        <AppLayout 
            title={project.name} 
            subtitle={`Project / ${project.id.slice(0, 8)}`}
            projectId={projectId}
            onReflectionCreated={fetchProjectDetails}
        >
            <div className="fade-up">
                <button 
                    onClick={() => router.push('/projects')}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
                    <ArrowLeft size={14} /> Back to Repository
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, alignItems: 'start' }}>
                    {/* Left: Project Info & Reflections */}
                    <div>
                        <div style={{ marginBottom: 40 }}>
                            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--ink)', marginBottom: 12 }}>{project.name}</h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                {project.techStack?.map(tech => (
                                    <span key={tech} style={{ fontSize: 11, fontFamily: 'var(--mono)', padding: '4px 10px', background: 'var(--paper-dark)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)' }}>
                                        {tech}
                                    </span>
                                ))}
                            </div>
                            <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.7, background: '#fff', border: '1px solid var(--border)', padding: 24, borderRadius: 12, whiteSpace: 'pre-wrap' }}>
                                {project.description || 'No project scope defined.'}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--serif)' }}>Reflections History</h2>
                                <button 
                                    onClick={() => open(projectId)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                    <Plus size={14} /> New Reflection
                                </button>
                            </div>

                            {/* Template filter tabs */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                                {TEMPLATE_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: 8,
                                            border: activeTab === tab.key ? '2px solid var(--amber)' : '1px solid var(--border)',
                                            background: activeTab === tab.key ? 'var(--paper-dark)' : '#fff',
                                            color: activeTab === tab.key ? 'var(--ink)' : 'var(--muted)',
                                            fontWeight: activeTab === tab.key ? 700 : 400,
                                            fontSize: 13,
                                            cursor: 'pointer',
                                            outline: 'none',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {filteredReflections.length > 0 ? (
                                    filteredReflections.map(r => {
                                        const typeKey = getTemplateKey(r);
                                        const typeStyle = TYPE_STYLES[typeKey] ?? TYPE_STYLES.lesson;
                                        return (
                                            <div key={r.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                                    <span style={{
                                                        fontFamily: 'var(--mono)', fontSize: 10,
                                                        fontWeight: 500, letterSpacing: '0.06em',
                                                        padding: '4px 10px', borderRadius: 6,
                                                        background: typeStyle.bg, color: typeStyle.color,
                                                    }}>
                                                        {typeStyle.label}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate(r.createdAt)}</span>
                                                        <div style={{ display: 'flex', gap: 10, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
                                                            <button 
                                                                onClick={() => open(projectId, { ...r, projectId })}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                                                                <Pencil size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteReflection(r.id)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rust)', display: 'flex', alignItems: 'center' }}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>{r.title}</h3>
                                                <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                    {r.content}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: 60, textAlign: 'center', background: '#fff', border: '1px dashed var(--border)', borderRadius: 12 }}>
                                        <p style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', color: 'var(--muted)' }}>No reflections recorded yet for this tab.</p>
                                        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>Try another template tab or add a new reflection.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>
                        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                            <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Vault Metadata</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                    <FileText size={16} color="var(--amber)" />
                                    <span>{project._count.reflections} Reflections</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                    <Calendar size={16} color="var(--amber)" />
                                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'start', gap: 10, fontSize: 13 }}>
                                    <Tag size={16} color="var(--amber)" />
                                    <span>{project.techStack.length} Technologies</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--ink)', color: 'var(--paper)', borderRadius: 12, padding: 24 }}>
                            <h4 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Project Analysis</h4>
                            <p style={{ fontSize: 12, lineHeight: 1.6, color: '#ece8df', fontWeight: 300, fontStyle: 'italic' }}>
                                &quot;Documenting your technical evolution here creates a searchable archive of your growth as an engineer.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
