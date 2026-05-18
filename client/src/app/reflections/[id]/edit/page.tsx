'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import NewReflectionModal from '@/components/dashboard/NewReflectionModal';

interface ReflectionDetail {
  id: string;
  projectId: string;
  title: string;
  category?: string;
  template_type?: string;
  content?: string;
  impact?: string;
  tags?: string[];
  fields?: Record<string, string | string[] | boolean>;
  userId: string;
}

export default function EditReflectionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, _hasHydrated } = useAuthStore();
  const [reflection, setReflection] = useState<ReflectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push('/login');
    }
  }, [user, _hasHydrated, router]);

  useEffect(() => {
    let isActive = true;

    const fetchReflection = async () => {
      if (!params?.id) return;
      try {
        const response = await api.get<ReflectionDetail>(`/reflections/${params.id}`);
        if (isActive) {
          setReflection(response.data);
        }
      } catch (error) {
        console.error('Failed to load reflection', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchReflection();

    return () => {
      isActive = false;
    };
  }, [params?.id]);

  const initialData = useMemo(() => {
    if (!reflection) return undefined;
    return {
      id: reflection.id,
      projectId: reflection.projectId,
      title: reflection.title,
      category: reflection.category,
      template_type: reflection.template_type,
      content: reflection.content,
      impact: reflection.impact,
      tags: reflection.tags,
      fields: reflection.fields,
    };
  }, [reflection]);

  if (!_hasHydrated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (!reflection) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
        Reflection not found or unavailable.
      </div>
    );
  }

  return (
    <NewReflectionModal
      isOpen
      initialData={initialData}
      onClose={() => router.push(`/reflections/${reflection.id}`)}
      onSuccess={() => router.push(`/reflections/${reflection.id}`)}
    />
  );
}
