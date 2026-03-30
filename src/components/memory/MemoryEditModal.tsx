'use client';

import { useState } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import type { MemoryEntry, MemoryType } from '@/types';
import { MEMORY_TYPE_META } from '@/types';

interface MemoryEditModalProps {
  open: boolean;
  trackId: string;
  memories: MemoryEntry[];
  onClose: () => void;
}

const TYPES: MemoryType[] = ['style', 'content', 'avoid', 'pattern'];

export default function MemoryEditModal({ open, trackId, memories, onClose }: MemoryEditModalProps) {
  const addMemoryEntry = useTrackStore(s => s.addMemoryEntry);
  const updateMemoryEntry = useTrackStore(s => s.updateMemoryEntry);
  const deleteMemoryEntry = useTrackStore(s => s.deleteMemoryEntry);
  const boostMemory = useTrackStore(s => s.boostMemory);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<MemoryType>('content');
  const [addMode, setAddMode] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryType>('content');

  if (!open) return null;

  const sorted = [...memories].sort((a, b) => b.confidence - a.confidence);
  const grouped: Partial<Record<MemoryType, MemoryEntry[]>> = {};
  for (const m of sorted) {
    (grouped[m.type] ||= []).push(m);
  }

  const startEdit = (m: MemoryEntry) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditType(m.type);
  };

  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateMemoryEntry(trackId, editingId, { content: editContent.trim(), type: editType });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addMemoryEntry(trackId, { type: newType, content: newContent.trim(), source: 'user' });
    setNewContent('');
    setAddMode(false);
  };

  const handleDelete = (memoryId: string) => {
    deleteMemoryEntry(trackId, memoryId);
    if (editingId === memoryId) setEditingId(null);
  };

  const labelStyle = { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#8C8276', marginBottom: 6 };
  const btnStyle = {
    borderRadius: 4, padding: '3px 8px', fontSize: 11,
    fontFamily: "'Courier Prime', monospace", cursor: 'pointer',
    border: '1px solid #E3DCCB', background: 'transparent', color: '#5A5148',
  };

  return (
    <div role="dialog" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#FCF9F0', borderRadius: 12,
        border: '1px solid #E3DCCB', width: 600, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E3DCCB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600 }}>
            记忆管理 ({memories.length} 条)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setAddMode(true)} style={{ ...btnStyle, background: '#E85D3B', color: 'white', border: 'none' }}>
              + 添加记忆
            </button>
            <button onClick={onClose} style={btnStyle}>关闭</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Add form */}
          {addMode && (
            <div style={{ marginBottom: 16, padding: 12, background: '#F5F1E8', borderRadius: 8, border: '1px solid #E3DCCB' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    style={{
                      ...btnStyle,
                      background: newType === t ? MEMORY_TYPE_META[t].color : 'transparent',
                      color: newType === t ? 'white' : '#5A5148',
                      borderColor: MEMORY_TYPE_META[t].color,
                    }}
                  >
                    {MEMORY_TYPE_META[t].label}
                  </button>
                ))}
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="输入记忆内容..."
                style={{
                  width: '100%', padding: 8, borderRadius: 6, border: '1px solid #E3DCCB',
                  background: '#FCF9F0', fontSize: 13, resize: 'vertical', minHeight: 60,
                  fontFamily: "'Courier Prime', monospace",
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={handleAdd} style={{ ...btnStyle, background: '#E85D3B', color: 'white', border: 'none' }}>保存</button>
                <button onClick={() => { setAddMode(false); setNewContent(''); }} style={btnStyle}>取消</button>
              </div>
            </div>
          )}

          {/* Memory list by type */}
          {TYPES.map(type => {
            const items = grouped[type];
            if (!items?.length) return null;
            const meta = MEMORY_TYPE_META[type];
            return (
              <div key={type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                  <span style={labelStyle}>{meta.label}</span>
                  <span style={{ fontSize: 11, color: '#C8BFA9' }}>({items.length})</span>
                </div>
                {items.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '8px 10px', marginBottom: 4, borderRadius: 6,
                    background: editingId === m.id ? '#F5F1E8' : 'transparent',
                    border: editingId === m.id ? '1px solid #E3DCCB' : '1px solid transparent',
                  }}>
                    {editingId === m.id ? (
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          {TYPES.map(t => (
                            <button
                              key={t}
                              onClick={() => setEditType(t)}
                              style={{
                                ...btnStyle, fontSize: 10, padding: '2px 6px',
                                background: editType === t ? MEMORY_TYPE_META[t].color : 'transparent',
                                color: editType === t ? 'white' : '#5A5148',
                                borderColor: MEMORY_TYPE_META[t].color,
                              }}
                            >
                              {MEMORY_TYPE_META[t].label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          style={{
                            width: '100%', padding: 6, borderRadius: 4, border: '1px solid #E3DCCB',
                            background: '#FCF9F0', fontSize: 12, resize: 'vertical', minHeight: 40,
                            fontFamily: "'Courier Prime', monospace",
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button onClick={saveEdit} style={{ ...btnStyle, fontSize: 10 }}>保存</button>
                          <button onClick={() => setEditingId(null)} style={{ ...btnStyle, fontSize: 10 }}>取消</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 12, color: '#3A3530', lineHeight: 1.5 }}>{m.content}</span>
                        <span style={{ fontSize: 10, color: '#8C8276', flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
                          {Math.round(m.confidence * 100)}%
                        </span>
                        <span style={{ fontSize: 9, color: '#C8BFA9', flexShrink: 0 }}>
                          {m.source === 'user' ? '手动' : m.source === 'system' ? '种子' : 'AI'}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => boostMemory(trackId, m.id, 0.1)} style={{ ...btnStyle, fontSize: 10, padding: '1px 4px' }} title="增强">+</button>
                          <button onClick={() => boostMemory(trackId, m.id, -0.1)} style={{ ...btnStyle, fontSize: 10, padding: '1px 4px' }} title="减弱">-</button>
                          <button onClick={() => startEdit(m)} style={{ ...btnStyle, fontSize: 10, padding: '1px 4px' }} title="编辑">E</button>
                          <button onClick={() => handleDelete(m.id)} style={{ ...btnStyle, fontSize: 10, padding: '1px 4px', color: '#c0392b' }} title="删除">x</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {memories.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#C8BFA9', fontSize: 13 }}>
              暂无记忆，点击"添加记忆"手动创建
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
