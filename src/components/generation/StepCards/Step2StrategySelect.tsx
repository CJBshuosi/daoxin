'use client';

import { STRATEGY_META, type StrategyType } from '@/types';

interface Step2Props {
  active: boolean;
  completed: boolean;
  recommendedStrategy?: string;
  recommendedSubDirection?: string;
  selectedStrategy?: StrategyType;
  selectedSubDirection?: string;
  onSelect: (strategy: StrategyType, subDirection: string) => void;
  onBack: () => void;
}

const strategyKeys = Object.keys(STRATEGY_META) as StrategyType[];

export default function Step2StrategySelect({
  active, completed, recommendedStrategy, recommendedSubDirection,
  selectedStrategy, selectedSubDirection, onSelect, onBack,
}: Step2Props) {
  const selectedMeta = selectedStrategy ? STRATEGY_META[selectedStrategy] : null;

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
          Step 2
        </span>
        <span style={{ fontSize: 12, color: '#5A5148' }}>策略选择</span>
        {completed && selectedMeta && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#E85D3B' }}>
            {selectedMeta.name} · {selectedSubDirection}
          </span>
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {active ? (
          <>
            <div style={{ fontSize: 12, color: '#8C8276', marginBottom: 12 }}>
              选择内容策略法
              {recommendedStrategy && (
                <span style={{ color: '#E85D3B', marginLeft: 4 }}>
                  (AI 推荐：{recommendedStrategy}{recommendedSubDirection ? ` · ${recommendedSubDirection}` : ''})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {strategyKeys.map(key => {
                const meta = STRATEGY_META[key];
                return (
                  <div key={key} style={{
                    background: '#F5F1E8',
                    borderRadius: 8,
                    border: '1px solid #E3DCCB',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, color: '#3A3530' }}>{meta.name}</div>
                      <div style={{ fontSize: 12, color: '#8C8276', marginTop: 2 }}>{meta.desc}</div>
                      <div style={{ fontSize: 10, color: '#8C8276', marginTop: 4 }}>
                        目标：<span style={{ color: '#E85D3B' }}>{meta.goal}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 12px 10px' }}>
                      {meta.subDirections.map(sub => (
                        <button
                          key={sub}
                          onClick={() => onSelect(key, sub)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            border: '1px solid #E3DCCB',
                            background: '#FCF9F0',
                            color: '#5A5148',
                            cursor: 'pointer',
                          }}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={onBack}
              style={{ marginTop: 12, fontSize: 12, color: '#8C8276', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              &larr; 返回上一步
            </button>
          </>
        ) : completed && selectedMeta ? (
          <div style={{ fontSize: 13, color: '#3A3530' }}>
            {selectedMeta.name} · <span style={{ color: '#E85D3B' }}>{selectedSubDirection}</span>
            <span style={{ color: '#8C8276', marginLeft: 8 }}>{selectedMeta.desc}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
