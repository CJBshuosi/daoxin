'use client';

import { useTrackStore } from '@/store/useTrackStore';

interface TrackListProps {
  onOpenHistory: (trackId: string) => void;
}

export default function TrackList({ onOpenHistory }: TrackListProps) {
  const tracks = useTrackStore(s => s.tracks);
  const currentId = useTrackStore(s => s.currentId);
  const selectTrack = useTrackStore(s => s.selectTrack);
  const deleteTrack = useTrackStore(s => s.deleteTrack);

  return (
    <div className="flex flex-col gap-1">
      {tracks.map(t => (
        <button
          key={t.id}
          onClick={() => selectTrack(t.id)}
          className={`flex items-center gap-2 px-2.5 py-2.5 rounded-md text-[13px] font-light text-left w-full transition-all border group
            ${t.id === currentId
              ? 'bg-sidebar-hover border-gold text-gold2'
              : 'bg-transparent border-transparent text-[#aaa] hover:bg-sidebar-hover hover:text-paper'
            }`}
        >
          <span
            className="w-[7px] h-[7px] rounded-full shrink-0"
            style={{ background: t.color }}
          />
          <span className="flex-1 truncate">{t.name}</span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory(t.id);
            }}
            className="text-[10px] text-ink3 bg-ink px-1.5 rounded-lg cursor-pointer hover:bg-gold hover:text-ink transition-colors"
            title="查看生成历史"
          >
            {t.count}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`确认删除赛道「${t.name}」？\n该赛道的记忆和配置将一并删除。`)) {
                deleteTrack(t.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-red cursor-pointer text-sm leading-none transition-opacity"
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
