'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookmarkPlus, Pencil, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import ReactionButtons from '@/components/feed/ReactionButtons';
import VaultButton from '@/components/feed/VaultButton';
import ShareButton from '@/components/feed/ShareButton';
import AddToCollectionPopover from '@/app/projects/_components/AddToCollectionPopover';

interface ReflectionDetail {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags?: string[];
  fields?: Record<string, unknown> | null;
  content?: string | null;
  userId: string;
  projectId: string;
  createdAt?: string;
}

interface ReactionCounts {
  useful: { count: number; reacted: boolean };
  critical: { count: number; reacted: boolean };
  applied: { count: number; reacted: boolean };
}

const EMPTY_REACTIONS: ReactionCounts = {
  useful: { count: 0, reacted: false },
  critical: { count: 0, reacted: false },
  applied: { count: 0, reacted: false },
};

const TEMPLATE_LABELS: Record<string, string> = {
  design_decision: 'Design Decision',
  technical_challenge: 'Technical Challenge',
  tradeoff: 'Tradeoff',
  lesson_learned: 'Lesson Learned',
  bug_autopsy: 'Bug Autopsy',
  integration_note: 'Integration Note',
};

export default function ReflectionDetailClient({ reflection }: { reflection: ReflectionDetail }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.id === reflection.userId;

  const [reactions, setReactions] = useState<ReactionCounts>(EMPTY_REACTIONS);
  const [vaulted, setVaulted] = useState(false);
  const [isLoadingReactions, setIsLoadingReactions] = useState(true);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedEntries, setRelatedEntries] = useState<ReflectionDetail[]>([]);

  useEffect(() => {
    let isActive = true;
    const fetchReactions = async () => {
      try {
        const response = await api.get<ReactionCounts>(`/reflections/${reflection.id}/reactions`);
        if (isActive) {
          setReactions(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch reactions', error);
      } finally {
        if (isActive) {
          setIsLoadingReactions(false);
        }
      }
    };

    fetchReactions();
    return () => {
      isActive = false;
    };
  }, [reflection.id]);

  useEffect(() => {
    let isActive = true;

    if (!user) {
      setVaulted(false);
      return;
    }

    const fetchVaultStatus = async () => {
      setIsLoadingVault(true);
      try {
        const response = await api.get<{ vaulted: boolean }>(`/reflections/${reflection.id}/vault-status`);
        if (isActive) {
          setVaulted(response.data.vaulted);
        }
      } catch {
        setVaulted(false);
      } finally {
        if (isActive) {
          setIsLoadingVault(false);
        }
      }
    };

    fetchVaultStatus();
    return () => {
      isActive = false;
    };
  }, [reflection.id, user]);

  useEffect(() => {
    let isActive = true;

    const fetchRelated = async () => {
      try {
        const response = await api.get(`/reflections/${reflection.id}/related`, {
          params: { limit: 4 },
        });
        const entries = response.data?.entries || [];
        if (isActive) {
          setRelatedEntries(entries);
        }
      } catch (error) {
        console.error('Failed to fetch related entries', error);
      }
    };

    fetchRelated();

    return () => {
      isActive = false;
    };
  }, [reflection.id]);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await api.delete(`/reflections/${reflection.id}`);
      router.push(`/projects/${reflection.projectId}`);
    } catch (error) {
      console.error('Failed to delete reflection', error);
      setIsDeleting(false);
    }
  };

  const relatedLabel = useMemo(() => {
    return relatedEntries.length > 0 ? 'More from this project' : 'No other entries yet';
  }, [relatedEntries.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
        paddingTop: 20,
      }}>
        {isLoadingReactions ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
            <Loader2 className="animate-spin" size={14} /> Loading reactions
          </div>
        ) : (
          <ReactionButtons entryId={reflection.id} counts={reactions} onReactionChange={setReactions} />
        )}

        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <VaultButton entryId={reflection.id} vaulted={vaulted} onVaultChange={setVaulted} />
          <ShareButton entryId={reflection.id} />
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowCollections((prev) => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <BookmarkPlus size={16} /> Add to collection
              </button>
              {showCollections && (
                <AddToCollectionPopover entryId={reflection.id} onClose={() => setShowCollections(false)} />
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              href={`/reflections/${reflection.id}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: '#f5f2eb',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                textDecoration: 'none',
              }}
            >
              <Pencil size={14} /> Edit
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid #f1c4c4',
                background: '#fff5f5',
                fontSize: 13,
                fontWeight: 600,
                color: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {relatedLabel && (
        <div style={{
          borderTop: '1px dashed var(--border)',
          paddingTop: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <p style={{
            fontSize: 11,
            fontFamily: 'var(--mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
          }}>
            {relatedLabel}
          </p>

          {relatedEntries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/reflections/${entry.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    textDecoration: 'none',
                    color: 'var(--ink)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{entry.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {TEMPLATE_LABELS[entry.template_type || entry.category] || entry.category}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Open
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Delete this entry?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              This action cannot be undone. The entry will be removed from your project and vault.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #b91c1c',
                  background: '#b91c1c',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoadingVault && (
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Syncing vault status...
        </div>
      )}
    </div>
  );
}
