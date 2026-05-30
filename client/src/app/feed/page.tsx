import { Suspense } from "react";
import type { Metadata } from "next";
import { FeedContent, FeedProvider } from "./feed-content";
import AppLayout from "@/components/dashboard/AppLayout";
import SkeletonCard from "@/components/feed/SkeletonCard";
import styles from "./feed.module.css";

export const metadata: Metadata = {
  title: "Community Feed | TraceVault",
  description: "Discover insights from the engineering community",
};

function FeedSkeleton() {
  return (
    <AppLayout
      title=""
      subtitle=""
    >
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

export default function FeedPage() {
  return (
    <FeedProvider>
      <Suspense fallback={<FeedSkeleton />}>
        <div className={styles.container}>
          <div className={styles.feed}>
            <AppLayout
              title=""
              subtitle=""
            >
              <FeedContent />
            </AppLayout>
          </div>
        </div>
      </Suspense>
    </FeedProvider>
  );
}
