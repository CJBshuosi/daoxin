'use client';

import { useState } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import { MEMORY_TYPE_META } from '@/types';
import type { Track } from '@/types';
import TrackModal from '@/components/track/TrackModal';
import TrackProfileModal from '@/components/track/TrackProfileModal';
import MemoryDisplay from '@/components/memory/MemoryDisplay';
import MemoryEditModal from '@/components/memory/MemoryEditModal';
import AnalysisPanel from '@/components/performance/AnalysisPanel';

export default function TracksPage() {
  const tracks = useTrackStore(s => s.tracks);
  const deleteTrack = useTrackStore(s => s.deleteTrack);
  const [selectedId, setSelectedId] = useState<string | null>(() => tracks[0]?.id ?? null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTrack, setProfileTrack] = useState<Track | null>(null);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'analysis'>('info');

  const selected = tracks.find(t => t.id === selectedId);

  const handleEdit = (track: Track) => {
    setEditTrack(track);
    setTrackModalOpen(true);
  };

  const handleDelete = (track: Track) => {
    if (confirm(`确定删除赛道「${track.name}」？记忆数据也会一起删除。`)) {
      deleteTrack(track.id);
      if (selectedId === track.id) setSelectedId(null);
    }
  };

  return (
    <div className="tw-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tw-page-title">赛道管理</div>
        <button
          onClick={() => { setEditTrack(null); setTrackModalOpen(true); }}
          style={{
            background: '#E85D3B', color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontFamily: "'Courier Prime', monospace",
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          + 新增赛道
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, height: 'calc(100% - 60px)' }}>
        {/* Track list */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tracks.map(t => (
              <div
                key={t.id}
                className="tw-card"
                style={{ borderColor: selectedId === t.id ? '#E85D3B' : undefined }}
                onClick={() => setSelectedId(t.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#3A3530' }}>{t.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8C8276' }}>{t.count} 次</span>
                </div>
                <div style={{ fontSize: 12, color: '#8C8276' }}>{t.desc || '暂无描述'}</div>
                <div style={{ fontSize: 11, color: '#C8BFA9', marginTop: 4 }}>
                  {(t.memories || []).length} 条记忆
                  {t.knowledgeSeeded && ' · 已注入知识库'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {selected ? (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: selected.color }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600 }}>{selected.name}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setProfileTrack(selected); setProfileModalOpen(true); }}
                    style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E3DCCB', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#5A5148' }}
                  >
                    {selected.profile ? '编辑画像' : '设置画像'}
                  </button>
                  <button onClick={() => handleEdit(selected)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E3DCCB', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#5A5148' }}>编辑</button>
                  <button onClick={() => handleDelete(selected)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E3DCCB', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#c0392b' }}>删除</button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #E3DCCB' }}>
                <button
                  onClick={() => setActiveTab('info')}
                  style={{
                    padding: '8px 16px', fontSize: 12, cursor: 'pointer',
                    background: 'transparent', border: 'none',
                    borderBottom: activeTab === 'info' ? '2px solid #E85D3B' : '2px solid transparent',
                    color: activeTab === 'info' ? '#E85D3B' : '#8C8276',
                    fontFamily: "'Courier Prime', monospace",
                  }}
                >
                  赛道信息
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  style={{
                    padding: '8px 16px', fontSize: 12, cursor: 'pointer',
                    background: 'transparent', border: 'none',
                    borderBottom: activeTab === 'analysis' ? '2px solid #E85D3B' : '2px solid transparent',
                    color: activeTab === 'analysis' ? '#E85D3B' : '#8C8276',
                    fontFamily: "'Courier Prime', monospace",
                  }}
                >
                  数据分析
                </button>
              </div>

              {activeTab === 'info' ? (
                <>
                  {/* Info */}
                  <div className="tw-card" style={{ marginBottom: 16, cursor: 'default' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                      <div><span style={{ color: '#8C8276' }}>描述：</span>{selected.desc || '无'}</div>
                      <div><span style={{ color: '#8C8276' }}>禁忌词：</span>{selected.banned || '无'}</div>
                      <div><span style={{ color: '#8C8276' }}>对标账号：</span>{selected.refAccounts.length ? selected.refAccounts.join('、') : '无'}</div>
                      <div><span style={{ color: '#8C8276' }}>知识库：</span>{selected.knowledgeSeeded ? (selected.knowledgeId === 'custom' ? 'AI 生成' : selected.knowledgeId) : '未注入'}</div>
                    </div>
                    {selected.profile && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E3DCCB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                        {selected.profile.targetAudience && <div><span style={{ color: '#8C8276' }}>目标受众：</span>{selected.profile.targetAudience}</div>}
                        {selected.profile.persona && <div><span style={{ color: '#8C8276' }}>人设：</span>{selected.profile.persona}</div>}
                        {selected.profile.product && <div><span style={{ color: '#8C8276' }}>变现：</span>{selected.profile.product}</div>}
                        {selected.profile.contentGoal && <div><span style={{ color: '#8C8276' }}>目标：</span>{selected.profile.contentGoal}</div>}
                      </div>
                    )}
                  </div>

                  {/* Few-shot */}
                  {selected.fewShot && (
                    <div className="tw-card" style={{ marginBottom: 16, cursor: 'default' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#8C8276', marginBottom: 8 }}>参考文案</div>
                      <div style={{ fontSize: 13, color: '#3A3530', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.fewShot}</div>
                    </div>
                  )}

                  {/* Memory */}
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#3A3530', marginBottom: 12 }}>
                    记忆系统 ({(selected.memories || []).length} 条)
                  </div>
                  <MemoryDisplay
                    memories={selected.memories}
                    trackName={selected.name}
                    onEdit={() => setMemoryModalOpen(true)}
                  />
                </>
              ) : (
                <AnalysisPanel track={selected} />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#C8BFA9', fontSize: 14 }}>
              选择左侧赛道查看详情
            </div>
          )}
        </div>
      </div>

      <TrackModal open={trackModalOpen} onClose={() => setTrackModalOpen(false)} editTrack={editTrack} />
      {selected && (
        <MemoryEditModal
          open={memoryModalOpen}
          trackId={selected.id}
          memories={selected.memories || []}
          onClose={() => setMemoryModalOpen(false)}
        />
      )}
      {profileTrack && (
        <TrackProfileModal
          open={profileModalOpen}
          track={profileTrack}
          onClose={() => setProfileModalOpen(false)}
          onComplete={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  );
}
