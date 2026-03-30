'use client';

import type { ContentPerformance, PerformanceLevel } from '@/types/performance';

interface PerformanceBadgeProps {
  performance: ContentPerformance;
  level: PerformanceLevel;
}

const LEVEL_COLORS: Record<PerformanceLevel, string> = {
  excellent: '#10b981',
  good: '#3b82f6',
  average: '#8C8276',
  poor: '#ef4444',
};

const LEVEL_LABELS: Record<PerformanceLevel, string> = {
  excellent: '优秀',
  good: '良好',
  average: '一般',
  poor: '待提升',
};

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function PerformanceBadge({ performance, level }: PerformanceBadgeProps) {
  const p = performance;
  const color = LEVEL_COLORS[level];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '6px 12px', background: '#F5F1E8', borderRadius: 6,
      fontSize: 12, color: '#5A5148',
    }}>
      <span style={{ color, fontWeight: 600, fontSize: 11, padding: '1px 6px', borderRadius: 3, background: color + '18', border: `1px solid ${color}44` }}>
        {LEVEL_LABELS[level]}
      </span>
      <span title="播放量">▶ {formatNum(p.views)}</span>
      <span title="点赞">👍 {formatNum(p.likes)}</span>
      <span title="评论">💬 {formatNum(p.comments)}</span>
      <span title="收藏">⭐ {formatNum(p.saves)}</span>
      <span title="涨粉">↗ {formatNum(p.followers)}</span>
      {p.completionRate != null && <span title="完播率">🔄 {p.completionRate}%</span>}
    </div>
  );
}
