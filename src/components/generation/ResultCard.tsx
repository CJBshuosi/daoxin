'use client';

import type { GenerationResult } from '@/types';
import EmotionCurve from './EmotionCurve';

interface ResultCardProps {
  result: GenerationResult;
  prompt: string;
  trackName: string;
  trackColor: string;
  createdAt?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRemove: () => void;
  onRegenerate: () => void;
  onRecordPerformance?: () => void;
  performanceSlot?: React.ReactNode;
}

export default function ResultCard({ result, prompt, trackName, trackColor, createdAt, collapsed, onToggleCollapse, onRemove, onRegenerate, onRecordPerformance, performanceSlot }: ResultCardProps) {
  const time = new Date(createdAt ?? Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const copyText = async (text: string, el: HTMLElement) => {
    await navigator.clipboard.writeText(text);
    const orig = el.textContent;
    el.textContent = '已复制 ✓';
    setTimeout(() => { el.textContent = orig; }, 1500);
  };

  const labelStyle = { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#8C8276', marginBottom: 4 };
  const btnStyle = {
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    fontFamily: "'Courier Prime', monospace",
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
  };

  return (
    <div className="tw-card" style={{ padding: 0, cursor: 'default' }}>
      {/* Header */}
      <div
        style={{
          background: '#F5F1E8',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          borderBottom: collapsed ? 'none' : '1px solid #E3DCCB',
          cursor: collapsed ? 'pointer' : 'default',
          transition: 'background 0.2s',
        }}
        onClick={collapsed ? onToggleCollapse : undefined}
      >
        <span style={{
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          background: trackColor + '22',
          color: trackColor,
          border: `1px solid ${trackColor}44`,
        }}>
          {trackName}
        </span>
        <span style={{ color: '#8C8276', fontStyle: 'italic', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {prompt.slice(0, 40)}{prompt.length > 40 ? '...' : ''}
        </span>
        <span style={{ color: '#8C8276', flexShrink: 0 }}>{time}</span>
        {onToggleCollapse && (
          <span
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
            style={{ fontSize: 10, color: '#8C8276', cursor: 'pointer', flexShrink: 0, marginLeft: 4 }}
          >
            {collapsed ? '▼' : '▲'}
          </span>
        )}
      </div>

      {/* Body */}
      {!collapsed && <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Performance badge */}
        {performanceSlot}

        {/* Copytext */}
        <div>
          <div style={labelStyle}>正文文案</div>
          <div className="copytext">{result.copytext.replace(/\\n/g, '\n')}</div>
        </div>

        {/* Titles */}
        <div>
          <div style={labelStyle}>爆款标题</div>
          {result.titles.map((title, i) => (
            <div
              key={i}
              onClick={(e) => copyText(title, e.currentTarget)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '6px 10px',
                background: '#F5F1E8',
                borderRadius: 4,
                fontSize: 13,
                color: '#3A3530',
                cursor: 'pointer',
                border: '1px solid transparent',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 10, color: '#8C8276', minWidth: 16, paddingTop: 2 }}>{i + 1}</span>
              <span>{title}</span>
            </div>
          ))}
        </div>

        {/* Emotion Curve */}
        {result.emotionCurve && result.emotionCurve.length > 0 && (
          <EmotionCurve points={result.emotionCurve} />
        )}

        {/* Shooting Guide */}
        {result.shootingGuide && (
          <div>
            <div style={labelStyle}>拍摄指导</div>
            <div style={{ background: '#F5F1E8', borderRadius: 8, border: '1px solid #E3DCCB', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#3A3530' }}><span style={{ color: '#8C8276', marginRight: 4 }}>开场镜头：</span>{result.shootingGuide.opening}</div>
              <div style={{ fontSize: 12, color: '#3A3530' }}><span style={{ color: '#8C8276', marginRight: 4 }}>画面风格：</span>{result.shootingGuide.style}</div>
              <div style={{ fontSize: 12, color: '#3A3530' }}><span style={{ color: '#8C8276', marginRight: 4 }}>转场方式：</span>{result.shootingGuide.transitions}</div>
            </div>
          </div>
        )}

        {/* Structure + Music */}
        <div style={{ display: 'flex', gap: 16 }}>
          {result.structure && (
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>内容结构</div>
              <span style={{ fontSize: 12, background: '#F5F1E8', border: '1px solid #E3DCCB', borderRadius: 4, padding: '4px 8px', color: '#3A3530' }}>{result.structure}</span>
            </div>
          )}
          {result.music?.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>BGM 推荐</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.music.map((m, i) => (
                  <span key={i} style={{ background: '#3A3530', color: '#E85D3B', borderRadius: 4, padding: '4px 10px', fontSize: 11, letterSpacing: 1 }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>}

      {/* Actions */}
      {!collapsed && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #E3DCCB', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={(e) => copyText(result.copytext, e.currentTarget)}
            style={{ ...btnStyle, background: '#E85D3B', color: 'white', border: 'none' }}
          >
            复制正文
          </button>
          {onRecordPerformance && (
            <button
              onClick={onRecordPerformance}
              style={{ ...btnStyle, background: 'transparent', border: '1px solid #E85D3B', color: '#E85D3B' }}
            >
              录入数据
            </button>
          )}
          <button
            onClick={onRegenerate}
            style={{ ...btnStyle, background: 'transparent', border: '1px solid #E3DCCB', color: '#5A5148' }}
          >
            重新生成
          </button>
          <button
            onClick={onRemove}
            style={{ ...btnStyle, background: 'transparent', border: '1px solid #E3DCCB', color: '#5A5148' }}
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
}
