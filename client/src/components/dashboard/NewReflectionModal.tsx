"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, Send, Info, Eye, Type, Gauge } from 'lucide-react';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Project {
    id: string;
    name: string;
}

interface NewReflectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedProjectId?: string;
    initialData?: {
        id?: string;
        projectId: string;
        title: string;
        type: string;
        impact: string;
        content: string;
    };
    onSuccess?: () => void;
}

const TYPES = [
    { value: 'decision', label: 'Design Decision', desc: 'Why you chose X over Y' },
    { value: 'challenge', label: 'Technical Challenge', desc: 'A hurdle you faced and solved' },
    { value: 'tradeoff', label: 'Tradeoff', desc: 'The compromise you made' },
    { value: 'lesson', label: 'Lesson Learned', desc: 'A key takeaway for future self' },
];

const IMPACTS = [
    { value: 'minor', label: 'Minor', color: 'var(--muted)' },
    { value: 'significant', label: 'Significant', color: 'var(--amber)' },
    { value: 'pivotal', label: 'Pivotal', color: 'var(--rust)' },
];

const TEMPLATES: Record<string, string> = {
    decision: `### Context\nBriefly describe the scenario...\n\n### Decision\nWhat path did you choose?\n\n### Results\nWhat was the outcome?`,
    challenge: `### Problem\nThe technical hurdle faced...\n\n### Solution\nHow it was overcome...\n\n### Impact\nHow the codebase improved...`,
    tradeoff: `### The Choice\nOption A vs Option B...\n\n### Tradeoff\nWhat was sacrificed for what benefit?\n\n### Rationale\nWhy this was acceptable for the project context.`,
    lesson: `### What Happened\nA brief recount...\n\n### Key Takeaway\nThe core lesson learned...\n\n### Future Action\nHow this changes future implementation.`,
};

export default function NewReflectionModal({ isOpen, onClose, preSelectedProjectId, initialData, onSuccess }: NewReflectionModalProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [formData, setFormData] = useState({
        projectId: preSelectedProjectId || '',
        title: '',
        type: 'decision',
        impact: 'minor',
        content: TEMPLATES.decision
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                projectId: initialData.projectId,
                title: initialData.title,
                type: initialData.type,
                impact: initialData.impact,
                content: initialData.content
            });
        } else if (preSelectedProjectId) {
            setFormData(prev => ({ ...prev, projectId: preSelectedProjectId, title: '', type: 'decision', impact: 'minor', content: TEMPLATES.decision }));
        }
    }, [initialData, preSelectedProjectId, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const handleTypeChange = (newType: string) => {
        const isDefault = Object.values(TEMPLATES).includes(formData.content.trim()) || formData.content.trim() === '';
        if (isDefault) {
            setFormData({ ...formData, type: newType, content: TEMPLATES[newType] });
        } else {
            setFormData({ ...formData, type: newType });
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
            if (!preSelectedProjectId && !initialData && res.data.length > 0) {
                setFormData(prev => ({ ...prev, projectId: res.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                await api.patch(`/reflections/${initialData.id}`, formData);
            } else {
                await api.post('/reflections', formData);
            }
            
            if (!initialData) {
                setFormData({
                    projectId: preSelectedProjectId || (projects[0]?.id || ''),
                    title: '',
                    type: 'decision',
                    impact: 'minor',
                    content: TEMPLATES.decision
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to save reflection', err);
            alert('Failed to save reflection. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(14, 13, 11, 0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
        }} onClick={onClose}>
            <div style={{
                background: '#f5f2eb', width: '100%', maxWidth: 1000,
                borderRadius: 20, border: '1px solid var(--border)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', height: '90vh',
                overflow: 'hidden', animation: 'fadeUp 0.3s ease both'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--paper-dark)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Type size={20} color="var(--ink)" />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)' }}>{initialData ? 'Update Entry' : 'Engineering Entry'}</h2>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.04em' }}>Technical logic & architectural archiving</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--paper-dark)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'var(--muted)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left: Metadata */}
                    <div style={{ width: 300, background: '#ece8df', borderRight: '1px solid var(--border)', padding: '32px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Project Archive</label>
                            <select 
                                required
                                value={formData.projectId}
                                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                disabled={!!preSelectedProjectId || !!initialData}
                                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, outline: 'none' }}
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Log Category</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => handleTypeChange(t.value)}
                                        style={{
                                            padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                                            border: '1px solid ' + (formData.type === t.value ? 'var(--amber)' : 'var(--border)'),
                                            background: formData.type === t.value ? 'var(--paper)' : '#fff',
                                            cursor: 'pointer', transition: 'all 0.15s'
                                        }}
                                    >
                                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.label}</p>
                                        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{t.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>System Impact</label>
                            <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                                {IMPACTS.map(i => (
                                    <button
                                        key={i.value}
                                        type="button"
                                        onClick={() => setFormData({...formData, impact: i.value})}
                                        style={{
                                            flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
                                            background: formData.impact === i.value ? i.color : 'transparent',
                                            color: formData.impact === i.value ? '#fff' : 'var(--muted)',
                                            fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {i.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Content & Editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px' }}>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Technical Handle / Title</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Summary for this entry..." 
                                style={{ width: '100%', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', fontSize: 16, fontWeight: 500, outline: 'none' }}
                            />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <label style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detailed Documentation</label>
                                </div>
                                <div style={{ display: 'flex', background: 'var(--paper-dark)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setIsPreview(false)}
                                        style={{ background: !isPreview ? 'var(--ink)' : 'transparent', color: !isPreview ? '#fff' : 'var(--muted)', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                        <Type size={12} /> Write
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsPreview(true)}
                                        style={{ background: isPreview ? 'var(--ink)' : 'transparent', color: isPreview ? '#fff' : 'var(--muted)', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                        <Eye size={12} /> Preview
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, position: 'relative' }}>
                                {isPreview ? (
                                    <div className="markdown-body" style={{ height: '100%', background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: 32, overflowY: 'auto', lineHeight: 1.6, color: 'var(--ink)' }}>
                                        <ReactMarkdown>{formData.content}</ReactMarkdown>
                                        <style>{`
                                            .markdown-body h1, .markdown-body h2, .markdown-body h3 { border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px; margin-top: 24px; font-family: var(--serif); font-weight: 500; }
                                            .markdown-body h3 { font-size: 1.25em; border-bottom: none; }
                                            .markdown-body p { margin-bottom: 16px; font-size: 15px; }
                                            .markdown-body ul, .markdown-body ol { margin-bottom: 16px; padding-left: 20px; }
                                            .markdown-body li { margin-bottom: 4px; font-size: 15px; }
                                            .markdown-body code { background: var(--paper-dark); padding: 2px 5px; borderRadius: 4px; font-family: var(--mono); font-size: 0.9em; }
                                            .markdown-body pre { background: var(--paper-dark); padding: 16px; borderRadius: 8px; margin-bottom: 16px; overflow-x: auto; }
                                            .markdown-body pre code { background: none; padding: 0; }
                                            .markdown-body blockquote { border-left: 4px solid var(--border); padding-left: 16px; color: var(--muted); margin-bottom: 16px; }
                                        `}</style>
                                    </div>
                                ) : (
                                    <textarea 
                                        required
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Write technical journal entry..." 
                                        style={{
                                            height: '100%', width: '100%', padding: '24px', borderRadius: 10, border: '1px solid var(--border)',
                                            background: '#fff', fontSize: 15, fontFamily: 'var(--mono)', outline: 'none',
                                            lineHeight: 1.7, resize: 'none', color: '#1a1815'
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ padding: '14px 40px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> {initialData ? 'Update Entry' : 'Seal Archive Entry'}</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
