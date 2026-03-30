'use client';

interface Step1Analysis {
  analysis: string;
  appeals: string[];
  desire: string;
  strategy: string;
  subDirection: string;
  goal: string;
  suggestion: string;
}

interface Step1Props {
  topic: string;
  analysisData?: Step1Analysis;
  loading: boolean;
  active: boolean;
  completed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Step1TopicConfirm({
  topic, analysisData, loading, active, completed, onConfirm, onCancel,
}: Step1Props) {
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
          Step 1
        </span>
        <span style={{ fontSize: 12, color: '#5A5148' }}>选题确认</span>
        {completed && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#E85D3B' }}>&#10003; 已确认</span>}
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#8C8276', marginBottom: 8 }}>
          主题：<span style={{ color: '#3A3530' }}>{topic}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', color: '#8C8276', fontSize: 13 }}>
            <div className="tw-spinner" />
            正在分析选题...
          </div>
        ) : analysisData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontSize: 13,
              color: '#3A3530',
              lineHeight: 1.6,
              background: 'rgba(232,93,59,0.04)',
              borderRadius: 6,
              padding: 12,
              borderLeft: '3px solid #E85D3B',
            }}>
              {analysisData.analysis}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
              {analysisData.appeals.length > 0 && (
                <div style={{ color: '#8C8276' }}>
                  诉求维度：
                  {analysisData.appeals.map((a, i) => (
                    <span key={i} style={{
                      display: 'inline-block',
                      background: '#F5F1E8',
                      border: '1px solid #E3DCCB',
                      borderRadius: 4,
                      padding: '2px 6px',
                      color: '#5A5148',
                      marginRight: 4,
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {analysisData.desire && (
                <div style={{ color: '#8C8276' }}>
                  底层欲望：<span style={{ color: '#5A5148' }}>{analysisData.desire}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
              <div style={{ color: '#8C8276' }}>
                推荐策略：<span style={{ color: '#E85D3B', fontWeight: 600 }}>{analysisData.strategy} · {analysisData.subDirection}</span>
              </div>
              <div style={{ color: '#8C8276' }}>
                目标：<span style={{ color: '#E85D3B', fontWeight: 600 }}>{analysisData.goal}</span>
              </div>
            </div>

            {analysisData.suggestion && (
              <div style={{ fontSize: 12, color: '#8C8276', fontStyle: 'italic' }}>
                {analysisData.suggestion}
              </div>
            )}
          </div>
        ) : null}

        {active && analysisData && !loading && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={onConfirm}
              style={{
                background: '#E85D3B',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '6px 16px',
                fontSize: 12,
                fontFamily: "'Courier Prime', monospace",
                cursor: 'pointer',
              }}
            >
              &#10003; 确认选题
            </button>
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid #E3DCCB',
                borderRadius: 6,
                padding: '6px 16px',
                fontSize: 12,
                color: '#8C8276',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
