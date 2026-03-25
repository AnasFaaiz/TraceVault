'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactionButtons from './ReactionButtons';
import VaultButton from './VaultButton';
import ShareButton from './ShareButton';
import styles from './FeedCard.module.css';

interface FeedCardEntry {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags: string[];
  snippet: string;
  confidence: string | null;
  createdAt: string;
  relativeDate: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  reactions: {
    useful: { count: number; reacted: boolean };
    felt_this: { count: number; reacted: boolean };
    critical: { count: number; reacted: boolean };
    noted: { count: number; reacted: boolean };
  };
  vaulted: boolean;
}

const IMPACT_STYLES: Record<string, { background: string; color: string }> = {
  minor:       { background: '#f3f3f3', color: '#666666' },
  significant: { background: '#fef3c7', color: '#92400e' },
  pivotal:     { background: '#fee2e2', color: '#991b1b' },
};

const TEMPLATE_LABELS: Record<string, string> = {
  design_decision:     'Design Decision',
  technical_challenge: 'Technical Challenge',
  tradeoff:            'Tradeoff',
  lesson_learned:      'Lesson Learned',
  bug_autopsy:         'Bug Autopsy',
  integration_note:    'Integration Note',
};

const FeedCard = ({ entry }: { entry: FeedCardEntry }) => {
  const router = useRouter();
  const [reactions, setReactions] = useState(entry.reactions);
  const [vaulted, setVaulted]     = useState(entry.vaulted);

  const handleCardClick = () => router.push(`/entry/${entry.id}`);

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/feed?view=for_you&tags=${encodeURIComponent(tag)}`);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const visibleTags   = entry.tags.slice(0, 4);
  const remainingTags = entry.tags.length - 4;

  const impactStyle  = IMPACT_STYLES[entry.impact]  ?? IMPACT_STYLES.minor;
  const typeLabel    = TEMPLATE_LABELS[entry.template_type || entry.category] ?? entry.category;

  return (
    <div className={styles.card} onClick={handleCardClick}>

      {/* AUTHOR ROW */}
      <div className={styles.authorRow}>
        <div className={styles.authorLeft}>
          <div className={styles.avatar}>
            {entry.author.avatarUrl ? (
              <img src={entry.author.avatarUrl} alt={entry.author.username} />
            ) : (
              <span className={styles.initials}>{getInitials(entry.author.username)}</span>
            )}
          </div>
          <span
            className={styles.username}
            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${entry.author.id}`); }}
          >
            {entry.author.username}
          </span>
          <span className={styles.dot} />
          <span className={styles.date}>{entry.relativeDate}</span>
        </div>

        <span
          className={styles.impactPill}
          style={impactStyle}
        >
          {entry.impact.charAt(0).toUpperCase() + entry.impact.slice(1)}
        </span>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        <span className={styles.typeBadge}>{typeLabel}</span>
        <h3 className={styles.title}>{entry.title}</h3>
        <p className={styles.snippet}>{entry.snippet}</p>
      </div>

      {/* TAGS */}
      {entry.tags.length > 0 && (
        <div className={styles.tagsRow}>
          {visibleTags.map((tag) => (
            <button key={tag} className={styles.tag} onClick={(e) => handleTagClick(tag, e)}>
              #{tag}
            </button>
          ))}
          {remainingTags > 0 && (
            <span className={styles.moreTagsButton}>+{remainingTags}</span>
          )}
        </div>
      )}

      {/* BOTTOM ROW */}
      <div className={styles.bottomRow}>
        <div className={styles.actions}>
          <ReactionButtons entryId={entry.id} counts={reactions} onReactionChange={setReactions} />
          <span className={styles.actionBtnDivider} />
          <VaultButton entryId={entry.id} vaulted={vaulted} onVaultChange={setVaulted} />
          <ShareButton entryId={entry.id} />
        </div>
      </div>

    </div>
  );
};

export default FeedCard;