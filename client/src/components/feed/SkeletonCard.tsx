'use client';

import styles from './SkeletonCard.module.css';

const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.header}>
        <div className={styles.avatar} />
        <div>
          <div className={styles.authorName} />
          <div className={styles.date} />
        </div>
        <div className={styles.badges}>
          <div className={`${styles.badge} ${styles.small}`} />
          <div className={`${styles.badge} ${styles.small}`} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.title} />
        <div className={styles.snippet} />
        <div className={`${styles.snippet} ${styles.short}`} />
      </div>

      <div className={styles.tags}>
        <div className={`${styles.tag}`} />
        <div className={`${styles.tag}`} />
        <div className={`${styles.tag}`} />
      </div>

      <div className={styles.footer}>
        <div className={styles.readTime} />
        <div className={styles.actions}>
          <div className={`${styles.reaction}`} />
          <div className={`${styles.reaction}`} />
          <div className={`${styles.reaction}`} />
          <div className={`${styles.reaction}`} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
