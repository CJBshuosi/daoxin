'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentPerformance, TrackPerformanceSummary, PerformanceLevel } from '@/types/performance';

function genId() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function computeScore(p: ContentPerformance): number {
  return p.views * 0.3 + p.likes * 0.25 + p.saves * 0.2 + p.comments * 0.1 + p.shares * 0.1 + p.followers * 0.05;
}

interface PerformanceStore {
  performances: ContentPerformance[];

  addPerformance: (data: Omit<ContentPerformance, 'id' | 'recordedAt' | 'updatedAt'>) => string;
  updatePerformance: (id: string, metrics: Partial<ContentPerformance>) => void;
  deletePerformance: (id: string) => void;

  getByHistoryItem: (historyItemId: string) => ContentPerformance | undefined;
  getByTrack: (trackId: string) => ContentPerformance[];

  getTrackSummary: (trackId: string) => TrackPerformanceSummary;
  getPerformanceLevel: (id: string) => PerformanceLevel;
}

export const usePerformanceStore = create<PerformanceStore>()(
  persist(
    (set, get) => ({
      performances: [],

      addPerformance: (data) => {
        const id = genId();
        const now = Date.now();
        set(s => ({
          performances: [...s.performances, { ...data, id, recordedAt: now, updatedAt: now }],
        }));
        return id;
      },

      updatePerformance: (id, metrics) => set(s => ({
        performances: s.performances.map(p =>
          p.id === id ? { ...p, ...metrics, updatedAt: Date.now() } : p
        ),
      })),

      deletePerformance: (id) => set(s => ({
        performances: s.performances.filter(p => p.id !== id),
      })),

      getByHistoryItem: (historyItemId) =>
        get().performances.find(p => p.historyItemId === historyItemId),

      getByTrack: (trackId) =>
        get().performances.filter(p => p.trackId === trackId),

      getTrackSummary: (trackId) => {
        const items = get().performances.filter(p => p.trackId === trackId);
        const total = items.length;
        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const strategyBreakdown: TrackPerformanceSummary['strategyBreakdown'] = {};
        for (const p of items) {
          const key = p.strategy;
          if (!strategyBreakdown[key]) {
            strategyBreakdown[key] = { count: 0, avgViews: 0, avgLikes: 0, avgSaves: 0 };
          }
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
          trackId,
          totalPosts: total,
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
    }),
    {
      name: 'daoxin_performance',
      partialize: (state) => ({ performances: state.performances }),
    }
  )
);
