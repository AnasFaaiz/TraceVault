'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ReflectionContent from '@/components/reflections/ReflectionContent';
import ReflectionDetailClient from './ReflectionDetailClient';
import api from '@/lib/api';
import Toast, { ToastType } from '@/components/Toast';

interface ReflectionDetail {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags?: string[];
  fields?: ReflectionFields | null;
  content?: string | null;
  userId: string;
  projectId: string;
}

type ReflectionFields = Record<string, string | string[] | boolean | null | undefined>;

const TEMPLATE_LABELS: Record<string, string> = {
  design_decision: 'Design Decision',
  technical_challenge: 'Technical Challenge',
  tradeoff: 'Tradeoff',
  lesson_learned: 'Lesson Learned',
  bug_autopsy: 'Bug Autopsy',
  integration_note: 'Integration Note',
};

const IMPACT_STYLES: Record<string, { background: string; color: string }> = {
  minor: { background: '#f3f3f3', color: '#666666' },
  significant: { background: '#fef3c7', color: '#92400e' },
  pivotal: { background: '#fee2e2', color: '#991b1b' },
};

function getConfidenceBadge(fields?: Record<string, unknown> | null) {
  if (!fields || typeof fields !== 'object') return null;
  const confidence = fields.confidence;
  if (typeof confidence !== 'string' || confidence.trim().length === 0) return null;
  return confidence;
}

function normalizeFields(fields?: Record<string, unknown> | null): ReflectionFields | null {
  if (!fields || typeof fields !== 'object') return null;
  const normalized: ReflectionFields = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    ) {
      normalized[key] = value;
      return;
    }

    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      normalized[key] = value;
    }
  });

  return normalized;
}

export default function ReflectionDetailPage() {
  const params = useParams<{ id: string }>();
  const [reflection, setReflection] = useState<ReflectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchReflection = async () => {
      if (!params?.id) return;
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');

      try {
        const response = await api.get<ReflectionDetail>(`/reflections/${params.id}`);
        if (isActive) {
          setReflection(response.data);
        }
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        let message = 'Something went wrong while loading this entry.';

        if (status === 403) {
          message = 'This entry is private. Log in with the owner account to view it.';
        } else if (status === 404) {
          message = 'We could not find this entry. It may have been deleted.';
        }

        if (isActive) {
          setHasError(true);
          setReflection(null);
          setErrorMessage(message);
          setToast({ message, type: 'error' });
        }
        console.error('Failed to load reflection', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchReflection();

    return () => {
      isActive = false;
    };
  }, [params?.id]);

  const templateLabel = useMemo(() => {
    if (!reflection) return '';
    return TEMPLATE_LABELS[reflection.template_type || reflection.category] || reflection.category;
  }, [reflection]);

  const impactStyle = useMemo(() => {
    if (!reflection) return IMPACT_STYLES.minor;
    return IMPACT_STYLES[reflection.impact] || IMPACT_STYLES.minor;
  }, [reflection]);

  const confidence = useMemo(() => getConfidenceBadge(reflection?.fields), [reflection]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (hasError || !reflection) {
    return (
      <div style={{ maxWidth: 720, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Reflection not available</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          {errorMessage || 'This entry might be private, deleted, or you may not have access.'}
        </p>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '40px auto', padding: 28, background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px #0001' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            padding: '6px 10px',
            borderRadius: 999,
          }}>
            {templateLabel}
          </span>
          <span style={{
            fontSize: 11,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '6px 10px',
            borderRadius: 999,
            background: impactStyle.background,
            color: impactStyle.color,
          }}>
            {reflection.impact}
          </span>
          {confidence && (
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '6px 10px',
              borderRadius: 999,
              background: '#f3f0ff',
              color: '#3b2f63',
              border: '1px solid #e2dcff',
            }}>
              Confidence: {confidence}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 30, fontFamily: 'var(--serif)', color: 'var(--ink)' }}>
          {reflection.title || 'Reflection'}
        </h1>

        {Array.isArray(reflection.tags) && reflection.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {reflection.tags.map((tag: string) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  border: '1px dashed var(--border)',
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <ReflectionContent
          category={reflection.category}
          templateType={reflection.template_type}
          fields={normalizeFields(reflection.fields)}
          content={reflection.content}
        />
      </div>

      <ReflectionDetailClient reflection={reflection} />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
