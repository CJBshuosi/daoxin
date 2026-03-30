'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTrackStore } from '@/store/useTrackStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';

export default function Home() {
  const { user, loading } = useAuth();
  const hydrated = useTrackStore(s => s.hydrated);
  const hydrateTrack = useTrackStore(s => s.hydrate);
  const hydratePerf = usePerformanceStore(s => s.hydrate);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || hydrated) return;
    Promise.all([hydrateTrack(user.id), hydratePerf(user.id)])
      .catch(e => setError(e.message));
  }, [user, hydrated, hydrateTrack, hydratePerf]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
        <p style={{ color: 'var(--text-muted, #8C8276)' }}>加载中...</p>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
        <p style={{ color: '#dc2626' }}>数据加载失败：{error}</p>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
        <p style={{ color: 'var(--text-muted, #8C8276)' }}>加载数据...</p>
      </div>
    );
  }

  return <AppLayout />;
}
