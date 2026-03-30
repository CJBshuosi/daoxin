'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

const MODELS = [
  { value: 'claude' as const, label: 'Claude Sonnet', desc: '结构化输出最强' },
  { value: 'qwen' as const, label: 'Qwen Max', desc: '中文创意最强' },
  { value: 'gemini' as const, label: 'Gemini 2.5 Pro', desc: '多模态强' },
  { value: 'gpt4' as const, label: 'GPT-4o', desc: '综合能力强' },
];

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const model = useSettingsStore(s => s.model);
  const setModel = useSettingsStore(s => s.setModel);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find(m => m.value === model) || MODELS[0];

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  return (
    <div className="tw-topbar">
      <div className="tw-brand">
        <div className="tw-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="tw-brand-text">道心文案</div>
      </div>

      <div ref={menuRef} style={{ position: 'relative' }}>
        <div className="tw-model-pill" onClick={() => setMenuOpen(v => !v)}>
          <div className="tw-model-led" />
          <span>Model: {currentModel.label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {menuOpen && (
          <div className="tw-model-menu">
            {MODELS.map(m => (
              <div
                key={m.value}
                className={`tw-model-option ${model === m.value ? 'selected' : ''}`}
                onClick={() => { setModel(m.value); setMenuOpen(false); }}
              >
                <span>{m.label}</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>{m.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
