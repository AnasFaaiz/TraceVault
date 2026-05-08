import React from 'react';
import { notFound } from 'next/navigation';
import ReflectionContent from '@/components/reflections/ReflectionContent';
import ReactionButtons from '@/components/feed/ReactionButtons';
import VaultButton from '@/components/feed/VaultButton';
import ShareButton from '@/components/feed/ShareButton';
import { useAuthStore } from '@/store/useAuthStore';

async function fetchReflection(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/reflections/${id}`,
    { credentials: 'include', cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function ReflectionDetailPage({ params }: { params: { id: string } }) {
  const reflection = await fetchReflection(params.id);
  if (!reflection) return notFound();

  // Get current user (client-side only)
  // This will be hydrated on the client for edit button
  // SSR: Hide edit button, show on client if owner

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>{reflection.title || 'Reflection'}</h1>
      <div style={{ marginBottom: 18 }}>
        <ReflectionContent reflection={reflection} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <ReactionButtons entryId={reflection.id} reactions={reflection.reactions} />
        <VaultButton entryId={reflection.id} vaulted={reflection.vaulted} />
        <ShareButton entryId={reflection.id} />
      </div>
      {/* Edit button only for owner, client-side check */}
      <EditButtonIfOwner reflection={reflection} />
    </div>
  );
}

function EditButtonIfOwner({ reflection }: { reflection: any }) {
  // This runs client-side only
  const user = useAuthStore((s) => s.user);
  if (!user || user.id !== reflection.userId) return null;
  return (
    <a href={`/reflections/${reflection.id}/edit`} style={{
      display: 'inline-block',
      marginTop: 12,
      padding: '8px 18px',
      background: '#f5f2eb',
      color: '#0e0d0b',
      borderRadius: 8,
      fontWeight: 500,
      textDecoration: 'none',
      fontSize: 15,
      border: '1px solid #e0ded8',
      transition: 'background 0.15s',
    }}>Edit</a>
  );
}
