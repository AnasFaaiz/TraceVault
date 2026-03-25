'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import styles from './ReactionButtons.module.css';

interface ReactionCounts {
  useful: { count: number; reacted: boolean };
  felt_this: { count: number; reacted: boolean };
  critical: { count: number; reacted: boolean };
  noted: { count: number; reacted: boolean };
}

interface ReactionButtonsProps {
  entryId: string;
  counts: ReactionCounts;
  onReactionChange?: (counts: ReactionCounts) => void;
}

const reactions = [
  { key: 'useful', emoji: '💡', label: 'Useful' },
  { key: 'felt_this', emoji: '😅', label: 'Felt this' },
  { key: 'critical', emoji: '🔥', label: 'Critical' },
  { key: 'noted', emoji: '🔩', label: 'Noted' },
] as const;

const ReactionButtons = ({ entryId, counts, onReactionChange }: ReactionButtonsProps) => {
  const user = useAuthStore((state) => state.user);
  const [localCounts, setLocalCounts] = useState(counts);
  const [optimisticUpdate, setOptimisticUpdate] = useState<string | null>(null);

  const handleReaction = useCallback(
    async (reactionType: keyof ReactionCounts) => {
      if (!user) {
        // Show login prompt
        return;
      }

      setOptimisticUpdate(reactionType);

      // Optimistic update
      const currentCount = localCounts[reactionType];
      const updatedCounts = {
        ...localCounts,
        [reactionType]: {
          count: currentCount.reacted ? currentCount.count - 1 : currentCount.count + 1,
          reacted: !currentCount.reacted,
        },
      };
      setLocalCounts(updatedCounts);

      try {
        const response = await api.post(`/reflections/${entryId}/reactions`, {
          type: reactionType,
        });

        if (onReactionChange) {
          onReactionChange(updatedCounts);
        }
      } catch (error) {
        // Revert on error
        setLocalCounts(counts);
        console.error('Failed to toggle reaction', error);
      } finally {
        setOptimisticUpdate(null);
      }
    },
    [entryId, user, localCounts, counts, onReactionChange],
  );

  return (
    <div className={styles.reactions}>
      {reactions.map(({ key, emoji, label }) => (
        <button
          key={key}
          className={`${styles.reaction} ${
            localCounts[key as keyof ReactionCounts].reacted ? styles.reacted : ''
          } ${optimisticUpdate === key ? styles.updating : ''}`}
          onClick={() => handleReaction(key as keyof ReactionCounts)}
          title={label}
          disabled={!user}
        >
          <span className={styles.emoji}>{emoji}</span>
          <span className={styles.count}>
            {localCounts[key as keyof ReactionCounts].count > 0 &&
              localCounts[key as keyof ReactionCounts].count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ReactionButtons;
