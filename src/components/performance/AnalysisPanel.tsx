'use client';

import { useState } from 'react';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useTrackStore } from '@/store/useTrackStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/hooks/useAuth';
import { STRATEGY_META } from '@/types';
import type { PerformanceAnalysis } from '@/types/performance';
import type { Track, MemoryType } from '@/types';

interface AnalysisPanelProps {
  track: Track;
}

export default function AnalysisPanel({ track }: AnalysisPanelProps) {
  const getByTrack = usePerformanceStore(s => s.getByTrack);
  const getTrackSummary = usePerformanceStore(s => s.getTrackSummary);
  const history = useTrackStore(s => s.history);
  const addMemoryEntry = useTrackStore(s => s.addMemoryEntry);
  const updateMemoryEntry = useTrackStore(s => s.updateMemoryEntry);
  const deleteMemoryEntry = useTrackStore(s => s.deleteMemoryEntry);
  const modelId = useSettingsStore(s => s.model);
  const apiKeys = useSettingsStore(s => s.apiKeys);
  const apiKey = apiKeys[modelId] || '';
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [adoptedActions, setAdoptedActions] = useState<Set<number>>(new Set());

  const performances = getByTrack(track.id);
  const summary = getTrackSummary(track.id);
  const canAnalyze = performances.length >= 5;

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAdoptedActions(new Set());
    try {
      const enriched = performances.map(p => {
        const h = history.find(hi => hi.id === p.historyItemId);
        return { ...p, prompt: h?.prompt || '', strategy: p.strategy };
      });
      const sorted = [...enriched].sort((a, b) =>
        (b.views * 0.3 + b.likes * 0.25 + b.saves * 0.2) - (a.views * 0.3 + a.likes * 0.25 + a.saves * 0.2)
      );

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const resp = await fetch('/api/performance/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          summary,
          topItems: sorted.slice(0, 3),
          bottomItems: sorted.slice(-3).reverse(),
          memories: track.memories || [],
          profile: track.profile,
          modelId,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Analysis failed');
      }
      setAnalysis(await resp.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const adoptAction = (idx: number) => {
    if (!analysis) return;
    const action = analysis.memoryActions[idx];
    if (action.action === 'add' && action.type) {
      addMemoryEntry(track.id, {
        type: action.type as MemoryType,
        content: action.content,
        source: 'user',
      }, user!.id);
    } else if (action.action === 'remove' && action.memoryId) {
      deleteMemoryEntry(track.id, action.memoryId);
    } else if (action.action === 'modify' && action.memoryId) {
      updateMemoryEntry(track.id, action.memoryId, { content: action.content });
    }
    setAdoptedActions(prev => new Set(prev).add(idx));
  };

  const labelStyle = { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#8C8276', marginBottom: 6 };
  const btnStyle = {
    borderRadius: 6, padding: '4px 12px', fontSize: 12,
    fontFamily: "'Courier Prime', monospace", cursor: 'pointer',
  };

  return (
    <div>
      {/* Stats overview */}
      <div className="tw-card" style={{ marginBottom: 16, cursor: 'default' }}>
        <div style={labelStyle}>数据概览</div>
        {performances.length === 0 ? (
          <div style={{ color: '#C8BFA9', fontSize: 13 }}>暂无表现数据，请先在文稿页录入</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: '#8C8276' }}>已录入：</span>{summary.totalPosts} 条</div>
            <div><span style={{ color: '#8C8276' }}>均播放：</span>{Math.round(summary.avgViews)}</div>
            <div><span style={{ color: '#8C8276' }}>均点赞：</span>{Math.round(summary.avgLikes)}</div>
            <div><span style={{ color: '#8C8276' }}>均收藏：</span>{Math.round(summary.avgSaves)}</div>
          </div>
        )}
      </div>

      {/* Strategy breakdown */}
      {Object.keys(summary.strategyBreakdown).length > 0 && (
        <div className="tw-card" style={{ marginBottom: 16, cursor: 'default' }}>
          <div style={labelStyle}>策略效果对比</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(summary.strategyBreakdown).map(([key, data]) => {
              const meta = STRATEGY_META[key as keyof typeof STRATEGY_META];
              const name = meta?.name || key;
              const maxViews = Math.max(...Object.values(summary.strategyBreakdown).map(d => d.avgViews), 1);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 80, flexShrink: 0, color: '#5A5148' }}>{name}</span>
                  <div style={{ flex: 1, height: 16, background: '#F5F1E8', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(data.avgViews / maxViews) * 100}%`,
                      height: '100%',
                      background: '#E85D3B',
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#8C8276', minWidth: 40, textAlign: 'right' }}>{data.count}条</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <button
        onClick={runAnalysis}
        disabled={!canAnalyze || loading}
        style={{
          ...btnStyle, width: '100%', padding: '10px 16px', marginBottom: 16,
          background: canAnalyze ? '#E85D3B' : '#E3DCCB',
          color: canAnalyze ? 'white' : '#8C8276',
          border: 'none',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? '分析中...' : canAnalyze ? 'AI 深度分析' : `需要至少 5 条数据 (${performances.length}/5)`}
      </button>

      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 6, background: '#FFF5F5', border: '1px solid #FFC9C9', color: '#c0392b', fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Overview */}
          <div className="tw-card" style={{ cursor: 'default' }}>
            <div style={labelStyle}>总体洞察</div>
            <div style={{ fontSize: 13, color: '#3A3530', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{analysis.overview}</div>
          </div>

          {/* Strategy recommendation */}
          <div className="tw-card" style={{ cursor: 'default' }}>
            <div style={labelStyle}>策略推荐</div>
            <div style={{ fontSize: 13, color: '#3A3530' }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#10b981' }}>推荐：{analysis.strategyRecommendation.best}</span>
                <span style={{ marginLeft: 8 }}>{analysis.strategyRecommendation.reason}</span>
              </div>
              {analysis.strategyRecommendation.avoid && (
                <div>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>慎用：{analysis.strategyRecommendation.avoid}</span>
                  <span style={{ marginLeft: 8 }}>{analysis.strategyRecommendation.avoidReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="tw-card" style={{ cursor: 'default' }}>
            <div style={labelStyle}>内容建议</div>
            {analysis.suggestions.map((s, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 10px', background: '#F5F1E8', borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: '#3A3530', fontWeight: 500 }}>{s.action}</div>
                <div style={{ fontSize: 12, color: '#8C8276', marginTop: 2 }}>{s.evidence}</div>
              </div>
            ))}
          </div>

          {/* Memory actions */}
          {analysis.memoryActions.length > 0 && (
            <div className="tw-card" style={{ cursor: 'default' }}>
              <div style={labelStyle}>记忆调整建议</div>
              {analysis.memoryActions.map((ma, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginBottom: 8, padding: '8px 10px', background: '#F5F1E8', borderRadius: 6,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, flexShrink: 0,
                    background: ma.action === 'add' ? '#10b98118' : ma.action === 'remove' ? '#ef444418' : '#3b82f618',
                    color: ma.action === 'add' ? '#10b981' : ma.action === 'remove' ? '#ef4444' : '#3b82f6',
                  }}>
                    {ma.action === 'add' ? '新增' : ma.action === 'remove' ? '删除' : '修改'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#3A3530' }}>{ma.content}</div>
                    <div style={{ fontSize: 11, color: '#8C8276', marginTop: 2 }}>{ma.reason}</div>
                  </div>
                  {adoptedActions.has(i) ? (
                    <span style={{ fontSize: 11, color: '#10b981', flexShrink: 0 }}>已采纳</span>
                  ) : (
                    <button
                      onClick={() => adoptAction(i)}
                      style={{ ...btnStyle, fontSize: 11, padding: '2px 8px', background: '#E85D3B', color: 'white', border: 'none', flexShrink: 0 }}
                    >
                      采纳
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
