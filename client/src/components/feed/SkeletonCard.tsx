'use client';

import styles from './SkeletonCard.module.css';

const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.header}>
        <div className={styles.avatar} />
        <div className={styles.authorBlock}>
          <div className={styles.authorName} />
          <div className={styles.authorMetaRow}>
            <div className={styles.date} />
            <div className={styles.dot} />
            <div className={styles.project} />
          </div>
        </div>
        <div className={styles.badges}>
          <div className={`${styles.badge} ${styles.tiny}`} />
          <div className={`${styles.badge} ${styles.small}`} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.eyebrow} />
        <div className={`${styles.title} ${styles.titlePrimary}`} />
        <div className={`${styles.title} ${styles.titleSecondary}`} />
        <div className={styles.snippet} />
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
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
