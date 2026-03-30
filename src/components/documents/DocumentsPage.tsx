'use client';

import { useState } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import ResultCard from '@/components/generation/ResultCard';

export default function DocumentsPage() {
  const tracks = useTrackStore(s => s.tracks);
  const history = useTrackStore(s => s.history);
  const selectTrack = useTrackStore(s => s.selectTrack);
  const deleteHistoryItem = useTrackStore(s => s.deleteHistoryItem);
  const navigate = useNavigationStore(s => s.navigate);

  const [filterTrackId, setFilterTrackId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filterTrackId ? history.filter(h => h.trackId === filterTrackId) : history;

  const handleRegenerate = (item: typeof history[number]) => {
    selectTrack(item.trackId);
    navigate('workspace', { topic: item.prompt, trackId: item.trackId });
  };

  return (
    <div className="tw-page">
      <div className="tw-page-title">文稿管理</div>
      <div className="tw-filter-bar">
        <button className={`tw-filter-btn ${!filterTrackId ? 'active' : ''}`} onClick={() => setFilterTrackId(null)}>
          全部 ({history.length})
        </button>
        {tracks.map(t => {
          const count = history.filter(h => h.trackId === t.id).length;
          if (count === 0) return null;
          return (
            <button key={t.id} className={`tw-filter-btn ${filterTrackId === t.id ? 'active' : ''}`} onClick={() => setFilterTrackId(t.id)}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: t.color, marginRight: 6 }} />
              {t.name} ({count})
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#C8BFA9', fontSize: 14 }}>暂无文稿记录</div>
        ) : (
          filtered.map(item => (
            <ResultCard
              key={item.id}
              result={item.result}
              prompt={item.prompt}
              trackName={item.trackName}
              trackColor={item.trackColor}
              createdAt={item.createdAt}
              collapsed={expandedId !== item.id}
              onToggleCollapse={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onRemove={() => deleteHistoryItem(item.id)}
              onRegenerate={() => handleRegenerate(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}
