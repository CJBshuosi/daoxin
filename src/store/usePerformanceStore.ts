'use client';

import { create } from 'zustand';
import type { ContentPerformance, TrackPerformanceSummary, PerformanceLevel } from '@/types/performance';
import { createClient } from '@/lib/supabase/client';

function genId() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function computeScore(p: ContentPerformance): number {
  return p.views * 0.3 + p.likes * 0.25 + p.saves * 0.2 + p.comments * 0.1 + p.shares * 0.1 + p.followers * 0.05;
}

const sb = () => createClient();

interface PerformanceStore {
  performances: ContentPerformance[];
  hydrated: boolean;

  hydrate: (userId: string) => Promise<void>;
  addPerformance: (data: Omit<ContentPerformance, 'id' | 'recordedAt' | 'updatedAt'>, userId: string) => string;
  updatePerformance: (id: string, metrics: Partial<ContentPerformance>) => void;
  deletePerformance: (id: string) => void;

  getByHistoryItem: (historyItemId: string) => ContentPerformance | undefined;
  getByTrack: (trackId: string) => ContentPerformance[];
  getTrackSummary: (trackId: string) => TrackPerformanceSummary;
  getPerformanceLevel: (id: string) => PerformanceLevel;
}

export const usePerformanceStore = create<PerformanceStore>()(
  (set, get) => ({
    performances: [],
    hydrated: false,

    hydrate: async (userId: string) => {
      const { data } = await sb()
        .from('performances')
        .select('*')
        .eq('user_id', userId);

      const performances: ContentPerformance[] = (data || []).map(p => ({
        id: p.id,
        historyItemId: p.history_item_id,
        trackId: p.track_id,
        platform: p.platform as ContentPerformance['platform'],
        publishedAt: p.published_at ? new Date(p.published_at).getTime() : Date.now(),
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        followers: p.followers,
        completionRate: p.completion_rate ?? undefined,
        avgWatchTime: p.avg_watch_time ?? undefined,
        sales: p.sales ?? undefined,
        revenue: p.revenue ?? undefined,
        clickRate: p.click_rate ?? undefined,
        strategy: p.strategy as ContentPerformance['strategy'],
        source: p.source as ContentPerformance['source'],
        recordedAt: new Date(p.recorded_at).getTime(),
        updatedAt: new Date(p.updated_at).getTime(),
        calibratedAt: p.calibrated_at ? new Date(p.calibrated_at).getTime() : undefined,
      }));

      set({ performances, hydrated: true });
    },

    addPerformance: (data, userId) => {
      const id = genId();
      const now = Date.now();
      const perf = { ...data, id, recordedAt: now, updatedAt: now };

      set(s => ({ performances: [...s.performances, perf] }));

      sb().from('performances').insert({
        id,
        history_item_id: data.historyItemId,
        track_id: data.trackId,
        user_id: userId,
        platform: data.platform,
        published_at: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        saves: data.saves,
        followers: data.followers,
        completion_rate: data.completionRate ?? null,
        avg_watch_time: data.avgWatchTime ?? null,
        sales: data.sales ?? null,
        revenue: data.revenue ?? null,
        click_rate: data.clickRate ?? null,
        strategy: data.strategy || null,
        source: data.source,
      }).then(() => {});

      return id;
    },

    updatePerformance: (id, metrics) => {
      set(s => ({
        performances: s.performances.map(p => p.id === id ? { ...p, ...metrics, updatedAt: Date.now() } : p),
      }));

      const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (metrics.views !== undefined) dbUpdate.views = metrics.views;
      if (metrics.likes !== undefined) dbUpdate.likes = metrics.likes;
      if (metrics.comments !== undefined) dbUpdate.comments = metrics.comments;
      if (metrics.shares !== undefined) dbUpdate.shares = metrics.shares;
      if (metrics.saves !== undefined) dbUpdate.saves = metrics.saves;
      if (metrics.followers !== undefined) dbUpdate.followers = metrics.followers;
      if (metrics.calibratedAt !== undefined) dbUpdate.calibrated_at = new Date(metrics.calibratedAt).toISOString();
      sb().from('performances').update(dbUpdate).eq('id', id).then(() => {});
    },

    deletePerformance: (id) => {
      set(s => ({ performances: s.performances.filter(p => p.id !== id) }));
      sb().from('performances').delete().eq('id', id).then(() => {});
    },

    getByHistoryItem: (historyItemId) => get().performances.find(p => p.historyItemId === historyItemId),
    getByTrack: (trackId) => get().performances.filter(p => p.trackId === trackId),

    getTrackSummary: (trackId) => {
      const items = get().performances.filter(p => p.trackId === trackId);
      const total = items.length;
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const strategyBreakdown: TrackPerformanceSummary['strategyBreakdown'] = {};
      for (const p of items) {
        const key = p.strategy;
        if (!strategyBreakdown[key]) strategyBreakdown[key] = { count: 0, avgViews: 0, avgLikes: 0, avgSaves: 0 };
        strategyBreakdown[key].count++;
      }
      for (const key of Object.keys(strategyBreakdown)) {
        const group = items.filter(p => p.strategy === key);
        strategyBreakdown[key].avgViews = avg(group.map(p => p.views));
        strategyBreakdown[key].avgLikes = avg(group.map(p => p.likes));
        strategyBreakdown[key].avgSaves = avg(group.map(p => p.saves));
      }

      const scored = items.map(p => ({ id: p.id, score: computeScore(p) })).sort((a, b) => b.score - a.score);
      const top20 = Math.max(1, Math.ceil(total * 0.2));
      const bottom20 = Math.max(1, Math.ceil(total * 0.2));

      return {
        trackId, totalPosts: total,
        avgViews: avg(items.map(p => p.views)),
        avgLikes: avg(items.map(p => p.likes)),
        avgSaves: avg(items.map(p => p.saves)),
        strategyBreakdown,
        topPerformers: scored.slice(0, top20).map(s => s.id),
        bottomPerformers: scored.slice(-bottom20).map(s => s.id),
      };
    },

    getPerformanceLevel: (id) => {
      const perf = get().performances.find(p => p.id === id);
      if (!perf) return 'average';
      const trackItems = get().performances.filter(p => p.trackId === perf.trackId);
      if (trackItems.length < 2) return 'good';
      const scores = trackItems.map(p => ({ id: p.id, score: computeScore(p) })).sort((a, b) => b.score - a.score);
      const rank = scores.findIndex(s => s.id === id);
      const pct = rank / scores.length;
      if (pct < 0.2) return 'excellent';
      if (pct < 0.5) return 'good';
      if (pct < 0.8) return 'average';
      return 'poor';
    },
  })
);
