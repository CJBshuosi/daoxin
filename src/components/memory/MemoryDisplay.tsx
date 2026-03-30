'use client';

import type { MemoryEntry } from '@/types';
import { MEMORY_TYPE_META } from '@/types';

interface MemoryDisplayProps {
  memories?: MemoryEntry[];
  trackName?: string;
  onEdit: () => void;
}

export default function MemoryDisplay({ memories, trackName, onEdit }: MemoryDisplayProps) {
  const sorted = (memories || [])
    .filter(m => m.confidence >= 0.2)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  const grouped: Partial<Record<string, MemoryEntry[]>> = {};
  for (const m of sorted) {
    (grouped[m.type] ||= []).push(m);
  }

  return (
    <div className="px-2">
      <div className="text-[10px] tracking-[2px] text-ink3 uppercase mb-1.5">
        记忆系统
      </div>
      {!trackName ? (
        <div className="text-[11px] text-[#777] leading-relaxed">选择一个Track后显示</div>
      ) : sorted.length === 0 ? (
        <div className="text-[11px] text-[#777] leading-relaxed">
          （空）— 生成并确认文案后AI会自动学习偏好
        </div>
      ) : (
        <div className="space-y-2">
          {(['style', 'content', 'avoid', 'pattern'] as const).map(type => {
            const items = grouped[type];
            if (!items?.length) return null;
            const meta = MEMORY_TYPE_META[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-[10px] text-ink3">{meta.label}</span>
                </div>
                {items.map(m => (
                  <div key={m.id} className="text-[11px] text-[#999] leading-relaxed pl-3 flex items-start gap-1">
                    <span className="shrink-0 mt-0.5">-</span>
                    <span className="flex-1">{m.content}</span>
                    <span
                      className="shrink-0 text-[9px] mt-0.5 opacity-60"
                      title={`置信度 ${Math.round(m.confidence * 100)}%`}
                    >
                      {Math.round(m.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      <button
        onClick={onEdit}
        className="mt-2 w-full text-[11px] text-gold bg-transparent border border-[#333] rounded py-1 px-2.5 hover:bg-sidebar-hover transition-colors"
      >
        管理记忆
      </button>
    </div>
  );
}
