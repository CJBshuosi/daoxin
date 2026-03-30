'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSettingsStore, type ModelId } from '@/store/useSettingsStore';

const MODELS: { id: ModelId; name: string; desc: string; provider: string; keyPlaceholder: string; pros: string; cons: string }[] = [
  { id: 'qwen', name: 'Qwen Max', desc: '阿里通义千问旗舰模型', provider: 'qwen', keyPlaceholder: 'sk-...（DashScope API Key）', pros: '中文创意最强，结构化输出稳定，性价比高', cons: '英文略弱于 Claude' },
  { id: 'claude', name: 'Claude Sonnet', desc: 'Anthropic 最新模型', provider: 'claude', keyPlaceholder: 'sk-ant-...（Anthropic API Key）', pros: '结构化输出最稳定，复杂指令遵循最好', cons: '价格较高' },
  { id: 'gemini', name: 'Gemini 2.5 Pro', desc: 'Google 最新模型', provider: 'gemini', keyPlaceholder: 'AI...（Google AI API Key）', pros: '多模态强，结构化输出好，价格适中', cons: '中文创意略逊于 Qwen' },
  { id: 'gpt4', name: 'GPT-4o', desc: 'OpenAI 旗舰模型', provider: 'gpt4', keyPlaceholder: 'sk-...（OpenAI API Key）', pros: '综合能力强，创意好', cons: '价格高，中文偶有不自然' },
];

export default function SettingsPage() {
  const model = useSettingsStore(s => s.model);
  const setModel = useSettingsStore(s => s.setModel);
  const apiKeys = useSettingsStore(s => s.apiKeys);
  const setApiKey = useSettingsStore(s => s.setApiKey);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  };

  return (
    <div className="tw-page">
      <div className="tw-page-title">设置</div>

      <div style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#3A3530', marginBottom: 12 }}>AI 模型</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MODELS.map(m => {
            const isSelected = model === m.id;
            const keyValue = apiKeys[m.id] || '';
            const isVisible = visibleKeys.has(m.id);

            return (
              <div
                key={m.id}
                className="tw-card"
                style={{
                  borderColor: isSelected ? '#E85D3B' : undefined,
                  background: isSelected ? 'rgba(232,93,59,0.04)' : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => setModel(m.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#E85D3B' : '#C8BFA9'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E85D3B' }} />}
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

                {/* API Key input */}
                <div
                  style={{ marginTop: 10, marginLeft: 26 }}
                  onClick={e => e.stopPropagation()}
                >
                  <label style={{ fontSize: 12, color: '#8C8276', display: 'block', marginBottom: 4 }}>
                    API Key
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={keyValue}
                      onChange={e => setApiKey(m.id, e.target.value)}
                      placeholder={m.keyPlaceholder}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border-light, #C8BFA9)',
                        background: 'var(--bg-base, #F5F1E8)',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        outline: 'none',
                        color: '#3A3530',
                      }}
                    />
                    <button
                      onClick={() => toggleKeyVisibility(m.id)}
                      style={{
                        padding: 4,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#8C8276',
                      }}
                    >
                      {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {isSelected && !keyValue && (
                    <div style={{ fontSize: 11, color: '#E85D3B', marginTop: 4 }}>
                      请填写 API Key 后才能使用此模型
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(232,93,59,0.06)', fontSize: 12, color: '#5A5148', lineHeight: 1.6 }}>
          API Key 仅保存在你的浏览器本地，不会上传到服务器。每次请求时通过加密连接直接发送到对应的 AI 服务商。
        </div>
      </div>
    </div>
  );
}
