'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import styles from './ReactionButtons.module.css';

interface ReactionCounts {
  useful: { count: number; reacted: boolean };
  critical: { count: number; reacted: boolean };
  applied: { count: number; reacted: boolean };
}

interface ReactionButtonsProps {
  entryId: string;
  counts: ReactionCounts;
  onReactionChange?: (counts: ReactionCounts) => void;
}

type ReactionKey = keyof ReactionCounts;

const reactions = [
  { key: 'useful' as ReactionKey, label: 'Useful', emoji: '💡' },
  { key: 'critical' as ReactionKey, label: 'Critical', emoji: '🔥' },
  { key: 'applied' as ReactionKey, label: 'Applied', emoji: '🛠' },
];

const ReactionButtons = ({ entryId, counts, onReactionChange }: ReactionButtonsProps) => {
  const user = useAuthStore((state) => state.user);
  const [localCounts, setLocalCounts] = useState(counts);
  const [optimisticUpdate, setOptimisticUpdate] = useState<string | null>(null);

  useEffect(() => {
    setLocalCounts(counts);
  }, [counts]);

  const handleReaction = useCallback(
    async (reactionType: ReactionKey) => {
      if (!user || optimisticUpdate) return;

      const previousCounts = localCounts;
      const isRemoving = previousCounts[reactionType].reacted;

      setOptimisticUpdate(reactionType);

      const updatedCounts: ReactionCounts = {
        useful: { ...previousCounts.useful },
        critical: { ...previousCounts.critical },
        applied: { ...previousCounts.applied },
      };

      if (isRemoving) {
        updatedCounts[reactionType] = {
          count: Math.max(0, updatedCounts[reactionType].count - 1),
          reacted: false,
        };
      } else {
        const activeReaction = reactions.find((reaction) => previousCounts[reaction.key].reacted);

        if (activeReaction) {
          updatedCounts[activeReaction.key] = {
            count: Math.max(0, updatedCounts[activeReaction.key].count - 1),
            reacted: false,
          };
        }

        updatedCounts[reactionType] = {
          count: updatedCounts[reactionType].count + 1,
          reacted: true,
        };
      }

      setLocalCounts(updatedCounts);

      try {
        await api.post(`/reflections/${entryId}/reactions`, { type: reactionType });
        onReactionChange?.(updatedCounts);
      } catch (error) {
        setLocalCounts(previousCounts);
        console.error('Failed to toggle reaction', error);
      } finally {
        setOptimisticUpdate(null);
      }
    },
    [entryId, user, localCounts, optimisticUpdate, onReactionChange],
  );

  return (
    <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
      <div className={styles.reactions} role="group" aria-label="Reactions">
        {reactions.map(({ key, label, emoji }) => {
          const isActive = localCounts[key].reacted;
          const isDisabled = !user || Boolean(optimisticUpdate);

          return (
            <button
              key={key}
              data-key={key}
              className={`${styles.reactionChip} ${
                isActive ? styles.chipActive : ''
              } ${optimisticUpdate === key ? styles.updating : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                void handleReaction(key);
              }}
              title={label}
              disabled={isDisabled}
            >
              <span className={styles.chipEmoji}>{emoji}</span>
              <span className={styles.chipCount}>{localCounts[key].count}</span>
              <span className={styles.chipLabel}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReactionButtons;