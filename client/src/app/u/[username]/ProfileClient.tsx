'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/profile.module.css';
import IdentityHeader from './_components/IdentityHeader';
import StatsCards from './_components/StatsCards';
import ActivityHeatmap from './_components/ActivityHeatmap';
import EntryList from './_components/EntryList';
import ProjectsShowcase from './_components/ProjectsShowcase';
import EngineeringBreakdown from './_components/EngineeringBreakdown';
import api from '@/lib/api';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import AppLayout from '@/components/dashboard/AppLayout';

interface ProfileData {
  identity: {
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    joinedAt: string;
    stack: string[];
  };
  stats: {
    totalEntries: number;
    totalProjects: number;
    pivotalCount: number;
    significantCount: number;
    minorCount: number;
    currentStreak: number;
    longestStreak: number;
    privateCount?: number;
  };
  activity: {
    activityData: { date: string; count: number }[];
    totalLastYear: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  breakdown: any;
  isOwnProfile: boolean;
}

export default function ProfileClient({ username }: { username: string }) {
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${username}/profile`);
        setData(response.data);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setToast('Profile link copied');
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handleEdit = () => {
    router.push('/settings/profile');
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '48px', alignItems: 'flex-start' }}>
          <div className={styles.skeleton} style={{ width: '120px', height: '120px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className={styles.skeleton} style={{ width: '40%', height: '32px', marginBottom: '16px' }} />
            <div className={styles.skeleton} style={{ width: '20%', height: '18px', marginBottom: '24px' }} />
            <div className={styles.skeleton} style={{ width: '60%', height: '20px', marginBottom: '24px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className={styles.skeleton} style={{ width: '120px', height: '36px' }} />
              <div className={styles.skeleton} style={{ width: '120px', height: '36px' }} />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '48px' }}>
          <div className={styles.skeleton} style={{ height: '140px' }} />
          <div className={styles.skeleton} style={{ height: '140px' }} />
          <div className={styles.skeleton} style={{ height: '140px' }} />
        </div>

        {/* Heatmap Skeleton */}
        <div className={styles.skeleton} style={{ height: '180px', marginBottom: '48px' }} />

        {/* Entries Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className={styles.skeleton} style={{ height: '50px' }} />
          <div className={styles.skeleton} style={{ height: '50px' }} />
          <div className={styles.skeleton} style={{ height: '50px' }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', gap: '16px' }}>
        <AlertCircle size={48} color="var(--text-muted)" />
        <h1 style={{ fontSize: '24px' }}>{error || 'Profile not found'}</h1>
        <button className={styles.btn} onClick={() => router.push('/feed')}>Back to Feed</button>
      </div>
    );
  }

  const content = (
    <div className={styles.profileContainer}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--foreground)',
          color: 'var(--background)',
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <CheckCircle size={16} color="#10b981" />
          {toast}
        </div>
      )}

      <IdentityHeader 
        data={data.identity} 
        isOwnProfile={data.isOwnProfile}
        onShare={handleShare}
        onEdit={handleEdit}
      />

      <StatsCards data={{ ...data.stats, privateCount: data.stats.privateCount || 0 }} />

      <ActivityHeatmap 
        data={data.activity.activityData} 
        totalLastYear={data.activity.totalLastYear} 
      />

      <EntryList username={username} />

      <ProjectsShowcase projects={data.projects} />

      <EngineeringBreakdown 
        username={data.identity.displayName}
        totalEntries={data.stats.totalEntries - (data.stats.privateCount || 0)}
        totalEntriesSummary={data.breakdown.totalEntriesSummary}
        templateBreakdown={data.breakdown.templateBreakdown}
        confidenceBreakdown={data.breakdown.confidenceBreakdown}
      />
      
      <footer style={{ marginTop: '40px', padding: '40px 0', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Built with TraceVault — Documenting engineering wisdom
      </footer>
    </div>
  );

  return token ? (
    <AppLayout title="Profile" subtitle="Engineering Identity">
      {content}
    </AppLayout>
  ) : content;
}
