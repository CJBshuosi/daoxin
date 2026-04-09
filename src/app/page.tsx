'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTrackStore } from '@/store/useTrackStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { createClient } from '@/lib/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateLocalDataToSupabase(userId: string, trackState: any, perfState: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const tracks: unknown[] = trackState?.tracks || [];
  const history: unknown[] = trackState?.history || [];
  const performances: unknown[] = perfState?.performances || [];

  // Upsert tracks
  if (tracks.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackRows = (tracks as any[]).map((t: any) => ({
      id: t.id,
      user_id: userId,
      name: t.name,
      description: t.desc ?? '',
      color: t.color ?? '#8B8589',
      banned: t.banned ?? '',
      few_shot: t.fewShot ?? '',
      ref_accounts: t.refAccounts ?? [],
      knowledge_id: t.knowledgeId ?? null,
      knowledge_seeded: t.knowledgeSeeded ?? false,
      profile_completed: t.profileCompleted ?? false,
      target_audience: t.profile?.targetAudience ?? '',
      persona: t.profile?.persona ?? '',
      product: t.profile?.product ?? '',
      content_goal: t.profile?.contentGoal ?? '',
      count: t.count ?? 0,
    }));
    await supabase.from('tracks').upsert(trackRows, { onConflict: 'id' });
  }

  // Upsert history items
  if (history.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyRows = (history as any[]).map((h: any) => ({
      id: h.id,
      user_id: userId,
      track_id: h.trackId,
      track_name: h.trackName ?? '',
      track_color: h.trackColor ?? '',
      prompt: h.prompt ?? '',
      result: h.result ?? null,
      strategy: h.strategy ?? null,
      used_memory_ids: h.usedMemoryIds ?? [],
      created_at: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
    }));
    await supabase.from('history_items').upsert(historyRows, { onConflict: 'id' });
  }

  // Upsert performances
  if (performances.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perfRows = (performances as any[]).map((p: any) => ({
      id: p.id,
      user_id: userId,
      history_item_id: p.historyItemId ?? null,
      track_id: p.trackId,
      platform: p.platform ?? 'other',
      published_at: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
      views: p.views ?? 0,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      saves: p.saves ?? 0,
      followers: p.followers ?? 0,
      completion_rate: p.completionRate ?? null,
      avg_watch_time: p.avgWatchTime ?? null,
      sales: p.sales ?? null,
      revenue: p.revenue ?? null,
      click_rate: p.clickRate ?? null,
      strategy: p.strategy ?? null,
      source: p.source ?? 'manual',
    }));
    await supabase.from('performances').upsert(perfRows, { onConflict: 'id' });
  }
}

export default function Home() {
  const { user, loading } = useAuth();
  const hydrated = useTrackStore(s => s.hydrated);
  const hydrateTrack = useTrackStore(s => s.hydrate);
  const hydratePerf = usePerformanceStore(s => s.hydrate);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || hydrated) return;

    async function initData() {
      // Check for legacy localStorage data
      const rawTrack = typeof window !== 'undefined' ? localStorage.getItem('daoxin_v1') : null;
      const rawPerf = typeof window !== 'undefined' ? localStorage.getItem('daoxin_performance') : null;

      let didMigrate = false;
      if (rawTrack) {
        try {
          const parsed = JSON.parse(rawTrack);
          const trackState = parsed?.state ?? parsed;
          const tracks: unknown[] = trackState?.tracks ?? [];
          if (tracks.length > 0) {
            const confirmed = window.confirm('检测到本地数据，是否导入到云端？');
            if (confirmed) {
              const perfState = rawPerf ? (JSON.parse(rawPerf)?.state ?? JSON.parse(rawPerf)) : null;
              await migrateLocalDataToSupabase(user!.id, trackState, perfState);
              didMigrate = true;
            }
            // 无论确定还是取消，都清掉旧数据，不再弹窗
            localStorage.removeItem('daoxin_v1');
            localStorage.removeItem('daoxin_performance');
          }
        } catch {
          // Ignore parse errors — proceed with normal hydration
        }
      }

      // Proceed with normal Supabase hydration
      await Promise.all([hydrateTrack(user!.id), hydratePerf(user!.id)]);
      void didMigrate; // suppress unused var warning
    }

    initData().catch(e => setError(e.message));
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
