'use client';

import { useState } from 'react';
import { BUILTIN_TRACKS } from '@/lib/knowledge-seeds';
import { MEMORY_TYPE_META } from '@/types';

export default function KnowledgePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const categories = [...new Set(BUILTIN_TRACKS.map(t => t.category))];
  const filtered = filterCategory ? BUILTIN_TRACKS.filter(t => t.category === filterCategory) : BUILTIN_TRACKS;
  const selected = BUILTIN_TRACKS.find(t => t.id === selectedId);

  return (
    <div className="tw-page" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="tw-page-title">内置知识库</div>

      {/* Category filter */}
      <div className="tw-filter-bar">
        <button
          className={`tw-filter-btn ${!filterCategory ? 'active' : ''}`}
          onClick={() => setFilterCategory(null)}
        >
          全部 ({BUILTIN_TRACKS.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`tw-filter-btn ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="tw-card-grid">
            {filtered.map(t => (
              <div
                key={t.id}
                className="tw-card"
                style={{ borderColor: selectedId === t.id ? '#E85D3B' : undefined }}
                onClick={() => setSelectedId(t.id)}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: '#3A3530', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#E85D3B', marginBottom: 6 }}>{t.category}</div>
                <div style={{ fontSize: 12, color: '#8C8276', lineHeight: 1.5 }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: '#C8BFA9', marginTop: 8 }}>{t.seeds.length} 条知识种子</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        {selected && (
          <div style={{ width: 360, flexShrink: 0, overflowY: 'auto', background: '#FCF9F0', borderRadius: 12, border: '1px solid #E3DCCB', padding: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: '#E85D3B', marginBottom: 8 }}>{selected.category}</div>
            <div style={{ fontSize: 13, color: '#5A5148', lineHeight: 1.5, marginBottom: 16 }}>{selected.desc}</div>

            {/* Seeds grouped by type */}
            {(['content', 'pattern', 'style', 'avoid'] as const).map(type => {
              const seeds = selected.seeds.filter(s => s.type === type);
              if (seeds.length === 0) return null;
              const meta = MEMORY_TYPE_META[type];
              return (
                <div key={type} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: meta.color, marginBottom: 6 }}>
                    {meta.label} ({seeds.length})
                  </div>
                  {seeds.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#3A3530', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', lineHeight: 1.5 }}>
                      {s.content}
                      <span style={{ fontSize: 10, color: '#C8BFA9', marginLeft: 8 }}>
                        {Math.round(s.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
