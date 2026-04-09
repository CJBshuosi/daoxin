// src/components/generation/QualityScoreCard.tsx
'use client';

import type { CheckerResult } from '@/types';

interface QualityScoreCardProps {
  result: CheckerResult;
  loading: boolean;
  optimizeCount: number;
  maxOptimize: number;
  onAccept: () => void;
  onOptimize: () => void;
}

const dimensionLabels: Record<string, string> = {
  '钩子质量': '🎣',
  '结构合理性': '🏗️',
  '信息密度': '📊',
  '时间路标': '⏱️',
  '语言直观性': '👁️',
  '情绪刺点': '💡',
  '内容安全': '🛡️',
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 8 ? '#27ae60' : score >= 6 ? '#E85D3B' : '#c0392b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: '#E3DCCB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 20, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

export default function QualityScoreCard({
  result, loading, optimizeCount, maxOptimize, onAccept, onOptimize,
}: QualityScoreCardProps) {
  const totalColor = result.totalScore >= 49 ? '#27ae60' : result.totalScore >= 35 ? '#E85D3B' : '#c0392b';
  const btnBase = {
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 12,
    fontFamily: "'Courier Prime', monospace",
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
    border: 'none',
  };

  return (
    <div style={{
      background: '#FCF9F0',
      border: `1px solid ${result.pass ? 'rgba(39,174,96,0.3)' : 'rgba(232,93,59,0.3)'}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: '#F5F1E8',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #E3DCCB',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: result.pass ? '#27ae60' : '#E85D3B', color: 'white' }}>质量评分</span>
        <span style={{ fontSize: 12, color: '#5A5148' }}>AI 自检报告</span>
        <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: totalColor }}>{result.totalScore}分</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Score bars */}
        {result.scores.map((s) => (
          <div key={s.dimension} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center' }}>{dimensionLabels[s.dimension] || '📋'}</span>
            <span style={{ fontSize: 11, color: '#5A5148', minWidth: 70 }}>{s.dimension}</span>
            <ScoreBar score={s.score} />
          </div>
        ))}

        {/* Low scores detail */}
        {result.scores.filter(s => s.score < 7 && s.suggestion).length > 0 && (
          <div style={{ marginTop: 4, padding: '8px 10px', background: '#F5F1E8', borderRadius: 6, fontSize: 11, color: '#5A5148' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8C8276' }}>待改进</div>
            {result.scores.filter(s => s.score < 7 && s.suggestion).map((s) => (
              <div key={s.dimension} style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{s.dimension}：</span>{s.suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Overall suggestion */}
        <div style={{ fontSize: 11, color: '#5A5148', padding: '6px 0', borderTop: '1px solid #E3DCCB' }}>
          <span style={{ fontWeight: 600 }}>整体建议：</span>{result.overallSuggestion}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {optimizeCount < maxOptimize && (
            <button
              onClick={onOptimize}
              disabled={loading}
              style={{
                ...btnBase,
                background: loading ? '#E3DCCB' : '#E85D3B',
                color: 'white',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'AI 优化中...' : `AI 优化（${maxOptimize - optimizeCount}次）`}
            </button>
          )}
          <button
            onClick={onAccept}
            disabled={loading}
            style={{
              ...btnBase,
              background: '#27ae60',
              color: 'white',
              opacity: loading ? 0.6 : 1,
            }}
          >
            接受文案
          </button>
        </div>
      </div>
    </div>
  );
}
