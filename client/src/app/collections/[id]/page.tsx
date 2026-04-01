"use client";

import { Loader2, ArrowLeft, Plus, Globe, Lock, Trash2, Pencil, X, Check } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/dashboard/AppLayout';

interface CollectionEntry {
  id: string;
  title: string;
  template_type: string;
  impact: string;
  projectName: string;
  topReactionEmoji: string | null;
  createdAt: string;
  relativeDate: string;
  addedAt: string;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  visibility: 'private' | 'public';
  entryCount: number;
  updatedAt: string;
  entries: CollectionEntry[];
}

const IMPACT_COLORS: Record<string, string> = {
  pivotal: 'var(--rust)',
  significant: 'var(--amber)',
  minor: 'var(--teal)'
};

const TEMPLATE_COLORS: Record<string, string> = {
  bug_autopsy: 'var(--rust)',
  design_decision: 'var(--teal)',
  technical_challenge: 'var(--amber)',
  tradeoff: '#ce9c09',
  lesson_learned: '#22c55e',
  integration_note: '#64748b',
  general: '#94a3b8'
};

function CollectionDetailPageContent() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddingEntry, setIsAddingEntry] = useState(false);

    useEffect(() => {
        fetchCollection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCollection = async () => {
        try {
            const response = await api.get(`/collections/${id}`);
            setCollection(response.data);
        } catch (err) {
            console.error('Failed to fetch collection', err);
            router.push('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async () => {
      if (!collection) return;
      const newVisibility = collection.visibility === 'public' ? 'private' : 'public';
      try {
        await api.patch(`/collections/${id}`, { visibility: newVisibility });
        setCollection({ ...collection, visibility: newVisibility });
      } catch (err) { console.error(err); }
    };

    const handleDeleteCollection = async () => {
      if (!confirm(`Permanently delete collection "${collection?.name}"?`)) return;
      try {
        await api.delete(`/collections/${id}`);
        router.push('/projects');
      } catch (err) { console.error(err); }
    };

    const handleRemoveEntry = async (entryId: string) => {
      if (!confirm('Remove from collection?')) return;
      try {
        await api.post(`/collections/${id}/entries`, { entryId });
        fetchCollection();
      } catch (err) { console.error(err); }
    };

    if (loading) return (
      <AppLayout title="Collection" subtitle="Loading...">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Loader2 className="animate-spin" color="var(--amber)" /></div>
      </AppLayout>
    );

    if (!collection) return null;

    const headerLeft = (
      <button 
        onClick={() => router.push('/projects')}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--mono)', textTransform: 'uppercase', padding: '12px 0' }}
      >
        <ArrowLeft size={14} /> Back to Projects
      </button>
    );

    const headerActions = (
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setIsAddingEntry(true)}
          style={{ background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Plus size={16} /> Add Entry
        </button>
      </div>
    );

    return (
        <AppLayout 
          title={collection.name} 
          subtitle="Collection Repository" 
          headerLeftContent={headerLeft} 
          headerActions={headerActions}
        >
            <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {/* SUBHEADER HERO */}
                <header style={{ marginBottom: '48px', background: '#fff', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(189, 147, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📚</div>
                        <div>
                          <h1 style={{ fontSize: '32px', color: 'var(--ink)', fontWeight: 600, fontFamily: 'var(--serif)', margin: 0 }}>{collection.name}</h1>
                          {collection.description && (
                            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6, marginTop: '4px', maxWidth: '600px' }}>{collection.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>{collection.entryCount} SECTIONS SEALED</span>
                      <button 
                        onClick={handleToggleVisibility}
                        style={{ background: collection.visibility === 'public' ? 'rgba(42, 107, 94, 0.05)' : 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: collection.visibility === 'public' ? 'var(--teal)' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)' }}>
                        {collection.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
                        {collection.visibility.toUpperCase()}
                      </button>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Pencil size={18} /></button>
                        <button onClick={handleDeleteCollection} style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                </header>

                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  {collection.entries.length === 0 ? (
                    <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--muted)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '24px', opacity: 0.5 }}>Empty</div>
                      <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--serif)' }}>This collection is currently empty</p>
                      <p style={{ fontSize: '14px', marginBottom: '32px' }}>Start grouping your engineering wisdom by adding entries from the community feed or your own vault.</p>
                      <button onClick={() => setIsAddingEntry(true)} style={{ background: 'var(--ink)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>+ Add First Entry</button>
                    </div>
                  ) : (
                    collection.entries.map((entry, idx) => (
                      <div key={entry.id} className="entry-row" style={{ padding: '24px 32px', borderBottom: idx === collection.entries.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'background 0.2s', cursor: 'pointer' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: TEMPLATE_COLORS[entry.template_type] || TEMPLATE_COLORS.general, boxShadow: `0 0 8px ${TEMPLATE_COLORS[entry.template_type] || TEMPLATE_COLORS.general}44` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span 
                              onClick={() => router.push(`/projects/${entry.id}`)}
                              style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--serif)' }}
                            >
                              {entry.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span>{entry.projectName}</span>
                            <span>•</span>
                            <span>{entry.relativeDate}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                           <span style={{ fontSize: '18px' }}>{entry.topReactionEmoji || ''}</span>
                           <span style={{ fontSize: '10px', color: IMPACT_COLORS[entry.impact], fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', padding: '4px 8px', borderRadius: '4px', background: `${IMPACT_COLORS[entry.impact]}11` }}>{entry.impact}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleRemoveEntry(entry.id); }}
                             className="remove-btn"
                             style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', opacity: 0, transition: 'all 0.2s' }}>
                             <X size={18} />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isAddingEntry && (
                  <AddEntryModal 
                    onClose={() => { setIsAddingEntry(false); fetchCollection(); }}
                    collectionId={id}
                    alreadyIn={collection.entries.map(e => e.id)}
                  />
                )}
            </div>

            <style jsx>{`
              .entry-row:hover { background: #fafaf9; }
              .entry-row:hover .remove-btn { opacity: 1 !important; }
              .entry-row:hover .remove-btn:hover { color: var(--rust); }
              @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </AppLayout>
    );
}

function AddEntryModal({ onClose, collectionId, alreadyIn }: { onClose: () => void, collectionId: string, alreadyIn: string[] }) {
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myEntries, setMyEntries] = useState<string[]>(alreadyIn);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchEntries();
    }, 300);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searchEntries = async () => {
    if (!query) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reflections/search?q=${query}`);
      setEntries(response.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleToggle = async (entryId: string) => {
    try {
      await api.post(`/collections/${collectionId}/entries`, { entryId });
      if (myEntries.includes(entryId)) setMyEntries(myEntries.filter(id => id !== entryId));
      else setMyEntries([...myEntries, entryId]);
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, animation: 'fadeIn 0.3s ease-out' }}>
       <div style={{ width: '100%', maxWidth: '540px', background: '#fcfbf8', borderRadius: '32px', padding: '40px', boxShadow: '0 32px 128px rgba(0,0,0,0.4)', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '32px', right: '32px', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'transition all 0.2s' }}><X size={16} /></button>
          
          <h3 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--serif)', marginBottom: '8px', color: 'var(--ink)' }}>Curate Reflections</h3>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '32px' }}>Search and select entries to seal into this collection.</p>

          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <input 
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter by title, tag, or project..."
              style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: '#fff', fontSize: '15px', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
            />
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" color="var(--amber)" /></div> : 
             entries.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', background: 'var(--paper)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
               <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{query ? 'No matching reflections found' : 'Type to search your repository'}</p>
             </div> :
             entries.map(e => {
               const isIn = myEntries.includes(e.id);
               return (
                 <div key={e.id} onClick={() => handleToggle(e.id)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', background: isIn ? 'rgba(42, 107, 94, 0.03)' : '#fff', borderColor: isIn ? 'var(--teal)' : 'var(--border)', transition: 'all 0.2s' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TEMPLATE_COLORS[e.template_type] || TEMPLATE_COLORS.general }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0, fontFamily: 'var(--serif)' }}>{e.title}</p>
                      <p style={{ fontSize: '10px', color: 'var(--muted)', margin: '2px 0 0', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{e.project?.name || 'In-box'}</p>
                    </div>
                    {isIn ? <div style={{ background: 'var(--teal)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} /></div> : <div style={{ border: '2px solid var(--border)', borderRadius: '50%', width: '20px', height: '20px' }} />}
                 </div>
               );
             })
            }
          </div>
          <button onClick={onClose} style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '16px', background: 'var(--ink)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px', letterSpacing: '0.02em', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>DONE</button>
       </div>
    </div>
  );
}

export default function CollectionDetailPage() {
    return (
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="var(--amber)" /></div>}>
            <CollectionDetailPageContent />
        </Suspense>
    );
}
