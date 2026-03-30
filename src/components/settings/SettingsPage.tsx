'use client';

import { useSettingsStore, type ModelId } from '@/store/useSettingsStore';

const MODELS: { id: ModelId; name: string; desc: string; pros: string; cons: string }[] = [
  { id: 'claude', name: 'Claude Sonnet', desc: 'Anthropic 最新模型', pros: '结构化输出最稳定，复杂指令遵循最好', cons: '价格较高' },
  { id: 'qwen', name: 'Qwen Max', desc: '阿里通义千问旗舰模型', pros: '中文创意最强，结构化输出稳定，性价比高', cons: '英文略弱于 Claude' },
  { id: 'gemini', name: 'Gemini 2.5 Pro', desc: 'Google 最新模型', pros: '多模态强，结构化输出好，价格适中', cons: '中文创意略逊于 Qwen' },
  { id: 'gpt4', name: 'GPT-4o', desc: 'OpenAI 旗舰模型', pros: '综合能力强，创意好', cons: '价格高，中文偶有不自然' },
];

export default function SettingsPage() {
  const model = useSettingsStore(s => s.model);
  const setModel = useSettingsStore(s => s.setModel);

  return (
    <div className="tw-page">
      <div className="tw-page-title">设置</div>

      <div style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#3A3530', marginBottom: 12 }}>AI 模型</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MODELS.map(m => (
            <div
              key={m.id}
              className="tw-card"
              style={{
                borderColor: model === m.id ? '#E85D3B' : undefined,
                background: model === m.id ? 'rgba(232,93,59,0.04)' : undefined,
              }}
              onClick={() => setModel(m.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${model === m.id ? '#E85D3B' : '#C8BFA9'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {model === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E85D3B' }} />}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3530' }}>{m.name}</span>
                <span style={{ fontSize: 12, color: '#8C8276' }}>{m.desc}</span>
              </div>
              <div style={{ marginLeft: 26, fontSize: 12, color: '#5A5148' }}>
                <span style={{ color: '#4ADE80' }}>+</span> {m.pros}
              </div>
              <div style={{ marginLeft: 26, fontSize: 12, color: '#8C8276' }}>
                <span style={{ color: '#E85D3B' }}>-</span> {m.cons}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
