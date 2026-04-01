'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function MeRedirectPage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    
    if (user?.username) {
      router.replace(`/u/${user.username}`);
    } else {
      // Fallback for existing sessions: fetch current user to get username
      const fetchAndRedirect = async () => {
        try {
          const response = await api.get('/auth/me');
          if (response.data.username) {
            router.replace(`/u/${response.data.username}`);
          } else {
            router.replace('/feed');
          }
        } catch {
          router.replace('/feed');
        }
      };
      fetchAndRedirect();
    }
  }, [user, _hasHydrated, router]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );
}
