'use client';

import React from 'react';
import styles from '@/styles/profile.module.css';
import { Share2, Edit2, Calendar } from 'lucide-react';
import Image from 'next/image';

interface IdentityHeaderProps {
  data: {
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    joinedAt: string;
    stack: string[];
  };
  isOwnProfile: boolean;
  onShare: () => void;
  onEdit: () => void;
}

const IdentityHeader: React.FC<IdentityHeaderProps> = ({ data, isOwnProfile, onShare, onEdit }) => {
  const initials = data.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className={styles.identityHeader}>
      <div className={styles.avatarContainer}>
        {data.avatarUrl ? (
          <Image src={data.avatarUrl} alt={data.displayName} width={80} height={80} className={styles.avatarImage} />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className={styles.identityInfo}>
        <h1 className={styles.displayName}>{data.displayName}</h1>
        <div className={styles.username}>@{data.username}</div>
        
        {data.bio && <p className={styles.bio}>{data.bio}</p>}

        <div className={styles.metadata}>
          <div className={styles.metadataItem}>
            <Calendar size={14} style={{ marginRight: '4px' }} />
            Member since {formatDate(data.joinedAt)}
          </div>
        </div>

        <div className={styles.stackTags}>
          {data.stack.map((tag) => (
            <span key={tag} className={styles.stackTag}>#{tag}</span>
          ))}
        </div>

        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onShare}>
            <Share2 size={16} />
            Share Profile
          </button>
          
          {isOwnProfile && (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onEdit}>
              <Edit2 size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityHeader;
