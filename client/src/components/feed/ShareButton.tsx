'use client';

import { useState, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import styles from './ShareButton.module.css';

interface ShareButtonProps {
  entryId: string;
  onShare?: () => void;
}

const ShareButton = ({ entryId, onShare }: ShareButtonProps) => {
  const [showToast, setShowToast] = useState(false);

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      const url = `/entry/${entryId}`;
      
      try {
        await navigator.clipboard.writeText(url);
        setShowToast(true);
        
        if (onShare) {
          onShare();
        }

        setTimeout(() => setShowToast(false), 2000);
      } catch (error) {
        console.error('Failed to copy link', error);
      }
    },
    [entryId, onShare],
  );

  return (
    <>
      <button
        className={styles.shareButton}
        onClick={handleShare}
        title="Copy link to clipboard"
      >
        <Share2 size={18} />
      </button>
      {showToast && (
        <div className={styles.toast}>
          Link copied to vault 📋
        </div>
      )}
    </>
  );
};

export default ShareButton;
