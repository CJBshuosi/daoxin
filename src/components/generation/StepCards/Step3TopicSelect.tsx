'use client';

import type { TopicOption } from '@/types';

interface Step3Props {
  topics?: TopicOption[];
  loading: boolean;
  active: boolean;
  completed: boolean;
  selectedTopic?: number;
  onSelect: (index: number) => void;
  onBack: () => void;
}

export default function Step3TopicSelect({
  topics, loading, active, completed, selectedTopic, onSelect, onBack,
}: Step3Props) {
  return (
    <div style={{
      background: '#FCF9F0',
      border: `1px solid ${completed ? '#E3DCCB' : 'rgba(232,93,59,0.3)'}`,
      borderRadius: 8,
      overflow: 'hidden',
      opacity: completed ? 0.6 : 1,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        background: '#F5F1E8',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #E3DCCB',
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
          background: completed ? 'rgba(232,93,59,0.15)' : '#E85D3B',
          color: completed ? '#E85D3B' : 'white',
        }}>
          Step 3
        </span>
        <span style={{ fontSize: 12, color: '#5A5148' }}>选题确定</span>
        {completed && selectedTopic !== undefined && topics && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#E85D3B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topics[selectedTopic]?.title}
          </span>
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', color: '#8C8276', fontSize: 13 }}>
            <div className="tw-spinner" />
            正在生成选题方案...
          </div>
        ) : topics && topics.length > 0 ? (
          <>
            {active && <div style={{ fontSize: 12, color: '#8C8276', marginBottom: 12 }}>选择一个选题方案：</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topics.map((t, i) => {
                const isSelected = completed && selectedTopic === i;
                const isDimmed = completed && selectedTopic !== i;
                return (
                  <button
                    key={i}
                    onClick={() => active && onSelect(i)}
                    disabled={!active}
                    style={{
                      textAlign: 'left' as const,
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'rgba(232,93,59,0.3)' : '#E3DCCB'}`,
                      background: isSelected ? 'rgba(232,93,59,0.04)' : '#F5F1E8',
                      opacity: isDimmed ? 0.5 : 1,
                      cursor: active ? 'pointer' : 'default',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: isSelected ? '#E85D3B' : '#8C8276',
                        }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ fontSize: 13, color: '#3A3530', fontWeight: 600 }}>{t.title}</span>
                      </div>
                      <div style={{ marginLeft: 20 }}>
                        <div style={{ fontSize: 12, color: '#5A5148', lineHeight: 1.5 }}>
                          <span style={{ fontSize: 10, color: '#8C8276', marginRight: 4 }}>[{t.hookType}]</span>
                          {t.hook}
                        </div>
                        {(active || isSelected) && (
                          <div style={{
                            fontSize: 11,
                            color: '#8C8276',
                            lineHeight: 1.5,
                            background: 'rgba(252,249,240,0.5)',
                            borderRadius: 4,
                            padding: 8,
                            borderLeft: '2px solid #E3DCCB',
                            marginTop: 6,
                          }}>
                            {t.executionPlan}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {active && (
              <button
                onClick={onBack}
                style={{ marginTop: 12, fontSize: 12, color: '#8C8276', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                &larr; 返回上一步
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
