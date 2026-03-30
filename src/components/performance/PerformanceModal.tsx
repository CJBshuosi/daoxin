'use client';

import { useState, useRef } from 'react';
import { usePerformanceStore } from '@/store/usePerformanceStore';
import { useTrackStore } from '@/store/useTrackStore';
import { calibrateMemories } from '@/lib/calibration';
import type { HistoryItem, StrategyType } from '@/types';

interface PerformanceModalProps {
  open: boolean;
  historyItem: HistoryItem;
  onClose: () => void;
}

interface ParsedMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers: number;
  completionRate?: number | null;
  avgWatchTime?: number | null;
}

export default function PerformanceModal({ open, historyItem, onClose }: PerformanceModalProps) {
  const addPerformance = usePerformanceStore(s => s.addPerformance);
  const getPerformanceLevel = usePerformanceStore(s => s.getPerformanceLevel);
  const boostMemory = useTrackStore(s => s.boostMemory);
  const getTrackMemories = useTrackStore(s => s.getTrackMemories);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ParsedMetrics | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileSelect = async (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setLoading(true);
      try {
        const resp = await fetch('/api/performance/parse-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || 'Parse failed');
        }
        const data = await resp.json();
        setMetrics({
          views: data.views ?? 0,
          likes: data.likes ?? 0,
          comments: data.comments ?? 0,
          shares: data.shares ?? 0,
          saves: data.saves ?? 0,
          followers: data.followers ?? 0,
          completionRate: data.completionRate,
          avgWatchTime: data.avgWatchTime,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse screenshot');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFileSelect(file);
  };

  const handleConfirm = () => {
    if (!metrics) return;

    const perfId = addPerformance({
      historyItemId: historyItem.id,
      trackId: historyItem.trackId,
      platform: 'douyin',
      publishedAt: historyItem.createdAt,
      views: metrics.views,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saves,
      followers: metrics.followers,
      completionRate: metrics.completionRate ?? undefined,
      avgWatchTime: metrics.avgWatchTime ?? undefined,
      strategy: (historyItem.strategy || 'mingdao') as StrategyType,
      source: 'screenshot',
    });

    // Auto-calibrate memories
    const usedIds = historyItem.usedMemoryIds || [];
    if (usedIds.length > 0) {
      const level = getPerformanceLevel(perfId);
      const trackMemories = getTrackMemories(historyItem.trackId);
      const adjustments = calibrateMemories(level, usedIds, trackMemories);
      for (const adj of adjustments) {
        boostMemory(historyItem.trackId, adj.memoryId, adj.delta);
      }
    }

    onClose();
  };

  const updateMetric = (key: keyof ParsedMetrics, value: number) => {
    if (metrics) setMetrics({ ...metrics, [key]: value });
  };

  const labelStyle = { fontSize: 11, color: '#8C8276', marginBottom: 2 };
  const inputStyle = {
    width: '100%', padding: '6px 8px', borderRadius: 4,
    border: '1px solid #E3DCCB', background: '#FCF9F0',
    fontSize: 13, fontFamily: "'Courier Prime', monospace",
  };
  const btnStyle = {
    borderRadius: 6, padding: '6px 16px', fontSize: 12,
    fontFamily: "'Courier Prime', monospace", cursor: 'pointer',
  };

  return (
    <div role="dialog" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#FCF9F0', borderRadius: 12,
        border: '1px solid #E3DCCB', width: 520, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E3DCCB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600 }}>
            录入表现数据
          </span>
          <button onClick={onClose} style={{ ...btnStyle, border: '1px solid #E3DCCB', background: 'transparent', color: '#5A5148' }}>关闭</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Upload area */}
          {!metrics && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #E3DCCB', borderRadius: 8, padding: 32,
                textAlign: 'center', cursor: 'pointer', background: '#F5F1E8',
                marginBottom: 16,
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div className="tw-spinner" />
                  <span style={{ color: '#8C8276', fontSize: 13 }}>AI 识别中...</span>
                </div>
              ) : preview ? (
                <img src={preview} alt="screenshot" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
              ) : (
                <div>
                  <div style={{ fontSize: 14, color: '#5A5148', marginBottom: 4 }}>拖入抖音数据截图</div>
                  <div style={{ fontSize: 12, color: '#C8BFA9' }}>或点击此处选择图片</div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, background: '#FFF5F5',
              border: '1px solid #FFC9C9', color: '#c0392b', fontSize: 12, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {/* Editable metrics */}
          {metrics && (
            <>
              <div style={{ fontSize: 12, color: '#8C8276', marginBottom: 12 }}>
                AI 识别结果（可手动修正）
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {([
                  ['views', '播放量'],
                  ['likes', '点赞'],
                  ['comments', '评论'],
                  ['shares', '转发'],
                  ['saves', '收藏'],
                  ['followers', '涨粉'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <div style={labelStyle}>{label}</div>
                    <input
                      type="number"
                      value={metrics[key]}
                      onChange={(e) => updateMetric(key, parseInt(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              {/* Optional metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={labelStyle}>完播率 (%)</div>
                  <input
                    type="number"
                    value={metrics.completionRate ?? ''}
                    onChange={(e) => updateMetric('completionRate', parseFloat(e.target.value) || 0)}
                    placeholder="可选"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={labelStyle}>平均观看 (秒)</div>
                  <input
                    type="number"
                    value={metrics.avgWatchTime ?? ''}
                    onChange={(e) => updateMetric('avgWatchTime', parseFloat(e.target.value) || 0)}
                    placeholder="可选"
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                style={{ ...btnStyle, width: '100%', background: '#E85D3B', color: 'white', border: 'none', padding: '10px 16px' }}
              >
                确认保存并校准记忆
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
