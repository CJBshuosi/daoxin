// src/types/performance.ts
import type { StrategyType } from './index';

export type Platform = 'douyin';
export type DataSource = 'api' | 'screenshot';
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor';

export interface ContentPerformance {
  id: string;
  historyItemId: string;
  trackId: string;
  platform: Platform;
  publishedAt: number;

  // Core metrics (required)
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers: number;

  // Advanced metrics (optional)
  completionRate?: number;
  avgWatchTime?: number;

  // Conversion metrics (optional)
  sales?: number;
  revenue?: number;
  clickRate?: number;

  // Metadata
  strategy: StrategyType;
  source: DataSource;
  recordedAt: number;
  updatedAt: number;
  calibratedAt?: number;
}

export interface TrackPerformanceSummary {
  trackId: string;
  totalPosts: number;
  avgViews: number;
  avgLikes: number;
  avgSaves: number;
  strategyBreakdown: Record<string, {
    count: number;
    avgViews: number;
    avgLikes: number;
    avgSaves: number;
  }>;
  topPerformers: string[];
  bottomPerformers: string[];
}

export interface PerformanceAnalysis {
  overview: string;
  strategyRecommendation: {
    best: string;
    reason: string;
    avoid?: string;
    avoidReason?: string;
  };
  suggestions: {
    action: string;
    evidence: string;
  }[];
  memoryActions: {
    action: 'add' | 'remove' | 'modify';
    memoryId?: string;
    type?: string;
    content: string;
    reason: string;
  }[];
}
