"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Send, AlertCircle, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { 
    getAllTemplates,
    getTemplate, 
    validateFields,
    TemplateType,
    FieldDefinition
} from '@/lib/templateDefinitions';

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
        category?: string;
        template_type?: string;
        content?: string;
        impact?: string;
        tags?: string[];
        fields?: Record<string, string | string[] | boolean>;
        type?: string; // legacy
    };
    onSuccess?: () => void;
}

const IMPACTS = [
    { value: 'minor', label: 'Minor', color: 'var(--muted)' },
    { value: 'significant', label: 'Significant', color: 'var(--amber)' },
    { value: 'pivotal', label: 'Pivotal', color: 'var(--rust)' },
];

const TEMPLATE_TYPES: TemplateType[] = [
    'design_decision',
    'technical_challenge',
    'tradeoff',
    'lesson_learned',
    'bug_autopsy',
    'integration_note'
];

const normalizeTemplateType = (value?: string): TemplateType => {
    if (value && TEMPLATE_TYPES.includes(value as TemplateType)) {
        return value as TemplateType;
    }
    return 'design_decision';
};

const mapLegacyTypeToCategory = (type: string): TemplateType => {
    const mapping: Record<string, TemplateType> = {
        'decision': 'design_decision',
        'challenge': 'technical_challenge',
        'tradeoff': 'tradeoff',
        'lesson': 'lesson_learned'
    };
    return mapping[type] || 'design_decision';
};

const getDefaultFieldsForTemplate = (templateType: TemplateType): Record<string, string | string[] | boolean> => {
    const template = getTemplate(templateType);
    
    const fields: Record<string, string | string[] | boolean> = {};
    template.fields.forEach(field => {
        if (field.type === 'toggle') {
            fields[field.name] = field.options?.[0] || '';
        } else {
            fields[field.name] = '';
        }
    });
    return fields;
};

export default function NewReflectionModal({ 
    isOpen, 
    onClose, 
    preSelectedProjectId, 
    initialData, 
    onSuccess 
}: NewReflectionModalProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [showTemplateWarning, setShowTemplateWarning] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<TemplateType | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement>>({});

    const [formData, setFormData] = useState({
        projectId: preSelectedProjectId || '',
        title: '',
        category: 'design_decision' as TemplateType,
        template_type: 'design_decision' as TemplateType,
        impact: 'minor',
        tags: [] as string[],
        fields: getDefaultFieldsForTemplate('design_decision')
    });

    // Initialize from initialData (supports both old and new formats)
    useEffect(() => {
        if (initialData) {
            const category = normalizeTemplateType(initialData.category || mapLegacyTypeToCategory(initialData.type || 'decision'));
            const template = normalizeTemplateType(initialData.template_type || category);
            
            setFormData({
                projectId: initialData.projectId,
                title: initialData.title,
                category,
                template_type: template,
                impact: initialData.impact || 'minor',
                tags: initialData.tags || [],
                fields: initialData.fields || getDefaultFieldsForTemplate(template)
            });
        } else if (preSelectedProjectId) {
            const category: TemplateType = 'design_decision';
            setFormData(prev => ({
                ...prev,
                projectId: preSelectedProjectId,
                title: '',
                category,
                template_type: category,
                fields: getDefaultFieldsForTemplate(category)
            }));
        }
        setValidationErrors([]);
    }, [initialData, preSelectedProjectId, isOpen]);

    // Fetch projects on modal open
    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

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

    const hasFilledFields = (): boolean => {
        if (formData.title.trim() !== '') return true;

        const activeTemplate = getTemplate(formData.template_type);

        return activeTemplate.fields.some((field) => {
            const value = formData.fields[field.name];

            if (field.type === 'toggle') {
                const defaultOption = field.options?.[0] || '';
                return typeof value === 'string' && value.trim() !== '' && value !== defaultOption;
            }

            if (Array.isArray(value)) {
                return value.some((item) => String(item).trim() !== '');
            }

            return typeof value === 'string' && value.trim() !== '';
        });
    };

    const handleTemplateChange = (newTemplate: TemplateType) => {
        if (formData.template_type !== newTemplate && hasFilledFields()) {
            setPendingTemplate(newTemplate);
            setShowTemplateWarning(true);
        } else {
            switchTemplate(newTemplate);
        }
    };

    const switchTemplate = (newTemplate: TemplateType) => {
        setFormData({
            ...formData,
            category: newTemplate,
            template_type: newTemplate,
            fields: getDefaultFieldsForTemplate(newTemplate)
        });
        setShowTemplateWarning(false);
        setPendingTemplate(null);
        setValidationErrors([]);
    };

    const handleTextareaInput = (fieldName: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [fieldName]: value
            }
        }));

        // Auto-expand textarea
        const textarea = textareaRefs.current[fieldName];
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
        }
    };

    const handleToggleChange = (fieldName: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [fieldName]: value
            }
        }));
    };

    const getTextFieldValue = (fieldName: string): string => {
        const value = formData.fields[fieldName];
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return typeof value === 'string' ? value : '';
    };

    const getSelectedQuickOptions = (field: FieldDefinition): string[] => {
        const raw = String(formData.fields[field.name] || '').trim();
        if (!raw) return [];

        const splitter = field.type === 'textarea' ? /\n+/ : /,+/;
        return raw
            .split(splitter)
            .map(item => item.trim())
            .filter(Boolean);
    };

    const handleQuickOptionSelect = (field: FieldDefinition, option: string) => {
        const mode = field.quickMode || 'multi';
        const selected = getSelectedQuickOptions(field);
        const hasOption = selected.includes(option);

        let nextValue = '';
        if (mode === 'single') {
            nextValue = hasOption ? '' : option;
        } else {
            const nextSelected = hasOption
                ? selected.filter(item => item !== option)
                : [...selected, option];
            nextValue = field.type === 'textarea'
                ? nextSelected.join('\n')
                : nextSelected.join(', ');
        }

        if (field.type === 'textarea') {
            handleTextareaInput(field.name, nextValue);
        } else {
            setFormData(prev => ({
                ...prev,
                fields: {
                    ...prev.fields,
                    [field.name]: nextValue
                }
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate fields
        const nextErrors: string[] = [];
        if (formData.title.trim().length === 0) {
            nextErrors.push('title');
        }

        const validation = validateFields(formData.template_type, formData.fields);
        if (!validation.valid) {
            nextErrors.push(...validation.missingFields);
        }

        if (nextErrors.length > 0) {
            setValidationErrors(nextErrors);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                projectId: formData.projectId,
                title: formData.title,
                category: formData.category,
                template_type: formData.template_type,
                impact: formData.impact,
                tags: formData.tags,
                fields: formData.fields
            };

            if (initialData?.id) {
                await api.patch(`/reflections/${initialData.id}`, payload);
            } else {
                await api.post('/reflections', payload);
            }

            // Reset form
            if (!initialData) {
                const initialCategory: TemplateType = 'design_decision';
                setFormData({
                    projectId: preSelectedProjectId || (projects[0]?.id || ''),
                    title: '',
                    category: initialCategory,
                    template_type: initialCategory,
                    impact: 'minor',
                    tags: [],
                    fields: getDefaultFieldsForTemplate(initialCategory)
                });
            }
            setValidationErrors([]);
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

    const currentTemplate = getTemplate(formData.template_type);
    const allTemplates = getAllTemplates();

    return (
        <div 
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(14, 13, 11, 0.5)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 20
            }} 
            onClick={onClose}
        >
            {/* Template Warning Dialog */}
            {showTemplateWarning && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1001
                    }}
                    onClick={() => setShowTemplateWarning(false)}
                >
                    <div 
                        style={{
                            background: '#fff', padding: '32px', borderRadius: 16,
                            maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid var(--border)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 12, color: 'var(--ink)' }}>
                            Unsaved Changes
                        </h3>
                        <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
                            You have unsaved content in this entry. Changing templates will clear your work. Continue anyway?
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                type="button"
                                onClick={() => setShowTemplateWarning(false)}
                                style={{
                                    flex: 1, padding: '12px 16px', border: '1px solid var(--border)',
                                    borderRadius: 8, background: '#fff', cursor: 'pointer',
                                    fontSize: 14, fontWeight: 500, color: 'var(--ink)'
                                }}
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={() => pendingTemplate && switchTemplate(pendingTemplate)}
                                style={{
                                    flex: 1, padding: '12px 16px', background: 'var(--rust)',
                                    borderRadius: 8, border: 'none', cursor: 'pointer',
                                    fontSize: 14, fontWeight: 500, color: '#fff'
                                }}
                            >
                                Switch Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div 
                style={{
                    background: '#f5f2eb', width: '100%', maxWidth: 1200,
                    borderRadius: 20, border: '1px solid var(--border)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', height: '90vh',
                    overflow: 'hidden'
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 32px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff'
                }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)' }}>
                            {initialData ? 'Update Entry' : 'Engineering Entry'}
                        </h2>
                        <p style={{
                            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)',
                            marginTop: 2, letterSpacing: '0.04em'
                        }}>
                            Structured technical knowledge capture
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{
                            background: 'var(--paper-dark)', border: 'none', borderRadius: '50%',
                            cursor: 'pointer', color: 'var(--muted)', width: 32, height: 32,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left Panel: Templates & Metadata */}
                    <div style={{ width: 320, background: '#ece8df', borderRight: '1px solid var(--border)', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                        
                        {/* Metadata Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{
                                    display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
                                    color: 'var(--muted)', textTransform: 'uppercase',
                                    marginBottom: 12, letterSpacing: '0.1em'
                                }}>
                                    Project Archive
                                </label>
                                <select
                                    required
                                    value={formData.projectId}
                                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                    disabled={!!preSelectedProjectId || !!initialData}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: 8,
                                        border: '1px solid var(--border)', background: '#fff',
                                        fontSize: 13, outline: 'none'
                                    }}
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
                                    color: 'var(--muted)', textTransform: 'uppercase',
                                    marginBottom: 12, letterSpacing: '0.1em'
                                }}>
                                    System Impact
                                </label>
                                <div style={{
                                    display: 'flex', gap: 4, background: '#fff', padding: 4,
                                    borderRadius: 8, border: '1px solid var(--border)'
                                }}>
                                    {IMPACTS.map(i => (
                                        <button
                                            key={i.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, impact: i.value })}
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

                        {/* Template Selector */}
                        <div>
                            <label style={{
                                display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
                                color: 'var(--muted)', textTransform: 'uppercase',
                                marginBottom: 12, letterSpacing: '0.1em'
                            }}>
                                Entry Template
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {allTemplates.map(template => (
                                    <button
                                        key={template.value}
                                        type="button"
                                        onClick={() => handleTemplateChange(template.value)}
                                        style={{
                                            padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                                            border: '1px solid ' + (formData.template_type === template.value ? 'var(--amber)' : 'var(--border)'),
                                            background: formData.template_type === template.value ? 'var(--paper)' : '#fff',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
                                                {template.category}
                                            </p>
                                            <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                                                {template.description}
                                            </p>
                                        </div>
                                        {formData.template_type === template.value && (
                                            <ChevronRight size={14} style={{ flexShrink: 0, marginLeft: 8, color: 'var(--amber)' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Form Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto' }}>
                        
                        {/* Title */}
                        <div style={{ marginBottom: 32 }}>
                            <label style={{
                                display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
                                color: 'var(--muted)', textTransform: 'uppercase',
                                marginBottom: 12, letterSpacing: '0.1em'
                            }}>
                                Technical Handle / Title
                            </label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Summary for this entry..."
                                style={{
                                    width: '100%', padding: '14px 18px', borderRadius: 10,
                                    border: validationErrors.includes('title') ? '2px solid var(--rust)' : '1px solid var(--border)',
                                    background: '#fff', fontSize: 16, fontWeight: 500, outline: 'none'
                                }}
                            />
                            {validationErrors.includes('title') && (
                                <p style={{ fontSize: 11, color: 'var(--rust)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={14} /> Title is required
                                </p>
                            )}
                        </div>

                        {/* Dynamic Fields */}
                        {currentTemplate && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {currentTemplate.fields.map((field: FieldDefinition) => (
                                    <div key={field.name}>
                                        <label style={{
                                            display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
                                            color: 'var(--muted)', textTransform: 'uppercase',
                                            marginBottom: 12, letterSpacing: '0.1em'
                                        }}>
                                            {field.label} {field.required && <span style={{ color: 'var(--rust)' }}>*</span>}
                                        </label>

                                        {field.type === 'text' && (
                                            <>
                                                <input
                                                    type="text"
                                                    value={getTextFieldValue(field.name)}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        fields: { ...prev.fields, [field.name]: e.target.value }
                                                    }))}
                                                    placeholder={field.placeholder}
                                                    style={{
                                                        width: '100%', padding: '12px 16px', borderRadius: 8,
                                                        border: validationErrors.includes(field.name) ? '2px solid var(--rust)' : '1px solid var(--border)',
                                                        background: '#fff', fontSize: 14, outline: 'none'
                                                    }}
                                                />
                                                {field.quickOptions && field.quickOptions.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                                        {field.quickOptions.map((option) => (
                                                            <button
                                                                key={`${field.name}-quick-${option}`}
                                                                type="button"
                                                                onClick={() => handleQuickOptionSelect(field, option)}
                                                                style={{
                                                                    padding: '6px 10px', borderRadius: 999,
                                                                    border: '1px solid ' + (getSelectedQuickOptions(field).includes(option) ? 'var(--ink)' : 'var(--border)'),
                                                                    background: getSelectedQuickOptions(field).includes(option) ? 'var(--ink)' : '#fff',
                                                                    color: getSelectedQuickOptions(field).includes(option) ? '#fff' : 'var(--muted)',
                                                                    fontSize: 11, fontFamily: 'var(--mono)',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {validationErrors.includes(field.name) && (
                                                    <p style={{ fontSize: 11, color: 'var(--rust)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <AlertCircle size={14} /> {field.label} is required
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {field.type === 'textarea' && (
                                            <>
                                                <textarea
                                                    ref={el => { if (el) textareaRefs.current[field.name] = el; }}
                                                    value={getTextFieldValue(field.name)}
                                                    onChange={e => handleTextareaInput(field.name, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    style={{
                                                        width: '100%', padding: '14px 16px', borderRadius: 8,
                                                        border: validationErrors.includes(field.name) ? '2px solid var(--rust)' : '1px solid var(--border)',
                                                        background: '#fff', fontSize: 14, fontFamily: 'var(--mono)',
                                                        outline: 'none', resize: 'none', minHeight: 84,
                                                        maxHeight: 240, overflowY: 'auto'
                                                    }}
                                                />
                                                {field.quickOptions && field.quickOptions.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                                        {field.quickOptions.map((option) => (
                                                            <button
                                                                key={`${field.name}-quick-${option}`}
                                                                type="button"
                                                                onClick={() => handleQuickOptionSelect(field, option)}
                                                                style={{
                                                                    padding: '6px 10px', borderRadius: 999,
                                                                    border: '1px solid ' + (getSelectedQuickOptions(field).includes(option) ? 'var(--ink)' : 'var(--border)'),
                                                                    background: getSelectedQuickOptions(field).includes(option) ? 'var(--ink)' : '#fff',
                                                                    color: getSelectedQuickOptions(field).includes(option) ? '#fff' : 'var(--muted)',
                                                                    fontSize: 11, fontFamily: 'var(--mono)',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {validationErrors.includes(field.name) && (
                                                    <p style={{ fontSize: 11, color: 'var(--rust)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <AlertCircle size={14} /> {field.label} is required
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {field.type === 'toggle' && field.options && (
                                            <>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {field.options.map(option => (
                                                        <button
                                                            key={`${field.name}-${option}`}
                                                            type="button"
                                                            onClick={() => handleToggleChange(field.name, option)}
                                                            style={{
                                                                padding: '8px 16px', borderRadius: 6,
                                                                border: '1px solid ' + (formData.fields[field.name] === option ? 'var(--ink)' : 'var(--border)'),
                                                                background: formData.fields[field.name] === option ? 'var(--ink)' : '#fff',
                                                                color: formData.fields[field.name] === option ? '#fff' : 'var(--ink)',
                                                                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                                {validationErrors.includes(field.name) && (
                                                    <p style={{ fontSize: 11, color: 'var(--rust)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <AlertCircle size={14} /> Please select an option
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {field.helpText && (
                                            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                                                {field.helpText}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '12px 32px', border: '1px solid var(--border)',
                                    borderRadius: 8, background: '#fff', cursor: 'pointer',
                                    fontSize: 14, fontWeight: 500, color: 'var(--ink)'
                                }}
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '12px 32px', background: 'var(--ink)',
                                    color: 'var(--paper)', border: 'none', borderRadius: 8,
                                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all 0.2s', opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {initialData ? 'Update Entry' : 'Create Entry'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
