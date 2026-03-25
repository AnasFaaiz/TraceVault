import { Suspense } from 'react';
import VaultContent from './VaultContent';
import AppLayout from '@/components/dashboard/AppLayout';
import SkeletonCard from '@/components/feed/SkeletonCard';
import styles from './vault.module.css';

function VaultSkeleton() {
  return (
    <AppLayout title="Vault" subtitle="Your saved reflections and insights">
      <div className={styles.container}>
        <div className={styles.feed}>
          <div className={styles.feedGrid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={<VaultSkeleton />}>
      <VaultContent />
    </Suspense>
  );
}
