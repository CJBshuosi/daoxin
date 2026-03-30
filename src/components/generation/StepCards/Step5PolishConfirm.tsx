'use client';

import { useState } from 'react';
import type { GenerationResult } from '@/types';
import EmotionCurve from '../EmotionCurve';

interface Step5Props {
  result: GenerationResult;
  loading: boolean;
  onPolish: (instruction: string) => void;
  onConfirm: (finalResult: GenerationResult) => void;
  onRegenerate: () => void;
  onBack: () => void;
}

export default function Step5PolishConfirm({
  result, loading, onPolish, onConfirm, onRegenerate, onBack,
}: Step5Props) {
  const [polishOpen, setPolishOpen] = useState(false);
  const [polishInput, setPolishInput] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedCopytext, setEditedCopytext] = useState(result.copytext);
  const [editedTitles, setEditedTitles] = useState(result.titles);

  const displayCopytext = editMode ? editedCopytext : result.copytext;
  const displayTitles = editMode ? editedTitles : result.titles;

  const copyToClipboard = async (text: string, e: React.MouseEvent<HTMLButtonElement>) => {
    await navigator.clipboard.writeText(text);
    const btn = e.currentTarget;
    const orig = btn.textContent;
    btn.textContent = '已复制 ✓';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  };

  const handlePolish = () => {
    if (!polishInput.trim()) return;
    if (editMode) setEditMode(false);
    onPolish(polishInput);
    setPolishInput('');
  };

  const handleConfirm = () => {
    if (editMode) {
      onConfirm({ ...result, copytext: editedCopytext, titles: editedTitles });
    } else {
      onConfirm(result);
    }
  };

  const handleEnterEdit = () => {
    setEditedCopytext(result.copytext);
    setEditedTitles([...result.titles]);
    setEditMode(true);
  };

  const handleTitleEdit = (index: number, value: string) => {
    setEditedTitles(prev => prev.map((t, i) => i === index ? value : t));
  };

  const labelStyle = { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#8C8276', marginBottom: 4 };
  const btnBase = {
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    fontFamily: "'Courier Prime', monospace",
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      background: '#FCF9F0',
      border: '1px solid rgba(232,93,59,0.3)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: '#F5F1E8',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #E3DCCB',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#E85D3B', color: 'white' }}>Step 5</span>
        <span style={{ fontSize: 12, color: '#5A5148' }}>润色确认</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#E85D3B', fontWeight: 600 }}>草稿</span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Copytext */}
        <div>
          <div style={labelStyle}>正文文案</div>
          {editMode ? (
            <textarea
              value={editedCopytext.replace(/\\n/g, '\n')}
              onChange={e => setEditedCopytext(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                background: 'rgba(232,93,59,0.04)',
                border: '1px solid rgba(232,93,59,0.3)',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: '#3A3530',
                lineHeight: 2,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div className="copytext">{result.copytext.replace(/\\n/g, '\n')}</div>
          )}
        </div>

        {/* Titles */}
        <div>
          <div style={labelStyle}>爆款标题</div>
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editedTitles.map((title, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#8C8276', minWidth: 16 }}>{i + 1}</span>
                  <input
                    value={title}
                    onChange={e => handleTitleEdit(i, e.target.value)}
                    style={{
                      flex: 1,
                      background: '#F5F1E8',
                      border: '1px solid #E3DCCB',
                      borderRadius: 4,
                      padding: '6px 10px',
                      fontSize: 13,
                      color: '#3A3530',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            displayTitles.map((title, i) => (
              <div
                key={i}
                onClick={(e) => copyToClipboard(title, e as unknown as React.MouseEvent<HTMLButtonElement>)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '6px 10px',
                  background: '#F5F1E8',
                  borderRadius: 4,
                  fontSize: 13,
                  color: '#3A3530',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  marginBottom: 6,
                  transition: 'border-color 0.2s',
                }}
              >
                <span style={{ fontSize: 10, color: '#8C8276', minWidth: 16, paddingTop: 2 }}>{i + 1}</span>
                <span>{title}</span>
              </div>
            ))
          )}
        </div>

        {/* Emotion Curve */}
        {result.emotionCurve && result.emotionCurve.length > 0 && (
          <EmotionCurve points={result.emotionCurve} />
        )}

        {/* Shooting Guide */}
        {result.shootingGuide && (
          <div>
            <div style={labelStyle}>拍摄指导</div>
            <div style={{ background: '#F5F1E8', borderRadius: 8, border: '1px solid #E3DCCB', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#3A3530' }}><span style={{ color: '#8C8276', marginRight: 4 }}>开场镜头：</span>{result.shootingGuide.opening}</div>
              <div style={{ fontSize: 12, color: '#3A3530' }}><span style={{ color: '#8C8276', marginRight: 4 }}>画面风格：</span>{result.shootingGuide.style}</div>
              <div style={{ fontSize: 12, color: '#3A3530' }}><span style={{ color: '#8C8276', marginRight: 4 }}>转场方式：</span>{result.shootingGuide.transitions}</div>
            </div>
          </div>
        )}

        {/* Structure + Music */}
        <div style={{ display: 'flex', gap: 16 }}>
          {result.structure && (
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>内容结构</div>
              <span style={{ fontSize: 12, background: '#F5F1E8', border: '1px solid #E3DCCB', borderRadius: 4, padding: '4px 8px', color: '#3A3530' }}>{result.structure}</span>
            </div>
          )}
          {result.music?.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>BGM 推荐</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.music.map((m, i) => (
                  <span key={i} style={{ background: '#3A3530', color: '#E85D3B', borderRadius: 4, padding: '4px 10px', fontSize: 11, letterSpacing: 1 }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #E3DCCB', paddingTop: 12 }}>
          <button onClick={(e) => copyToClipboard(displayCopytext.replace(/\\n/g, '\n'), e)} style={{ ...btnBase, background: '#E85D3B', color: 'white', border: 'none' }}>
            复制正文
          </button>
          <button onClick={(e) => copyToClipboard(displayTitles.join('\n'), e)} style={{ ...btnBase, background: '#3A3530', color: '#E85D3B', border: 'none' }}>
            复制标题
          </button>
          <button
            onClick={() => setPolishOpen(!polishOpen)}
            style={{
              ...btnBase,
              background: polishOpen ? '#E85D3B' : 'transparent',
              color: polishOpen ? 'white' : '#5A5148',
              border: polishOpen ? 'none' : '1px solid #E3DCCB',
            }}
          >
            {polishOpen ? '关闭润色' : '打开润色'}
          </button>
          {editMode ? (
            <button onClick={() => setEditMode(false)} style={{ ...btnBase, background: 'transparent', border: '1px solid rgba(232,93,59,0.4)', color: '#E85D3B' }}>
              退出编辑
            </button>
          ) : (
            <button onClick={handleEnterEdit} style={{ ...btnBase, background: 'transparent', border: '1px solid #E3DCCB', color: '#5A5148' }}>
              编辑内容
            </button>
          )}
        </div>

        {/* Polish panel */}
        {polishOpen && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={polishInput}
                onChange={e => setPolishInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePolish(); }
                }}
                rows={2}
                placeholder="输入改写需求，如「语气再活泼一些」、「缩短到200字以内」..."
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#F5F1E8',
                  border: '1px solid #E3DCCB',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  color: '#3A3530',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <button
              onClick={handlePolish}
              disabled={loading || !polishInput.trim()}
              style={{
                ...btnBase,
                background: '#E85D3B',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                minHeight: 40,
                whiteSpace: 'nowrap',
                opacity: (loading || !polishInput.trim()) ? 0.5 : 1,
              }}
            >
              {loading ? '润色中...' : '全文润色'}
            </button>
          </div>
        )}

        {/* Confirm / back buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #E3DCCB', paddingTop: 12 }}>
          <button onClick={onBack} style={{ fontSize: 12, color: '#8C8276', background: 'none', border: 'none', cursor: 'pointer' }}>
            &larr; 返回选题
          </button>
          <button onClick={onRegenerate} style={{ ...btnBase, background: 'transparent', border: '1px solid #E3DCCB', color: '#5A5148' }}>
            重新生成
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              ...btnBase,
              marginLeft: 'auto',
              background: '#E85D3B',
              color: 'white',
              border: 'none',
              padding: '6px 20px',
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
            }}
          >
            确认文案
          </button>
        </div>
      </div>
    </div>
  );
}
