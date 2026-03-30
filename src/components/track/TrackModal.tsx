'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTrackStore } from '@/store/useTrackStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/lib/constants';
import type { Track, MemoryType } from '@/types';

interface TrackModalProps {
  open: boolean;
  onClose: () => void;
  editTrack?: Track | null;
}

interface MatchResult {
  match: string | null;
  matchName: string | null;
  confidence: number;
  reason: string;
}

type KnowledgeStep = 'form' | 'matching' | 'confirm' | 'generating' | 'done';

export default function TrackModal({ open, onClose, editTrack }: TrackModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [banned, setBanned] = useState('');
  const [fewShot, setFewShot] = useState('');

  const [step, setStep] = useState<KnowledgeStep>('form');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const addTrack = useTrackStore(s => s.addTrack);
  const updateTrack = useTrackStore(s => s.updateTrack);
  const seedKnowledge = useTrackStore(s => s.seedKnowledge);
  const seedCustomKnowledge = useTrackStore(s => s.seedCustomKnowledge);
  const modelId = useSettingsStore(s => s.model);
  const { user } = useAuth();

  useEffect(() => {
    if (editTrack) {
      setName(editTrack.name);
      setDesc(editTrack.desc);
      setColor(editTrack.color);
      setBanned(editTrack.banned);
      setFewShot(editTrack.fewShot);
    } else {
      setName('');
      setDesc('');
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setBanned('');
      setFewShot('');
    }
    setStep('form');
    setMatchResult(null);
    setPendingTrackId(null);
    setGenerateSuccess(false);
  }, [editTrack, open]);

  const handleSave = async () => {
    if (!name.trim()) { alert('请输入赛道名称'); return; }
    const data = {
      name: name.trim(),
      desc: desc.trim(),
      color,
      banned: banned.trim(),
      fewShot: fewShot.trim(),
      memory: editTrack?.memory ?? '',
      memories: editTrack?.memories ?? [],
      refAccounts: editTrack?.refAccounts ?? [],
      count: editTrack?.count ?? 0,
    };

    if (editTrack) {
      updateTrack(editTrack.id, data);
      onClose();
      return;
    }

    const trackId = await addTrack(data, user!.id);
    setPendingTrackId(trackId);

    setStep('matching');
    setMatchLoading(true);
    try {
      const resp = await fetch('/api/match-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), desc: desc.trim(), model: modelId }),
      });
      if (resp.ok) {
        const result: MatchResult = await resp.json();
        setMatchResult(result);
        setStep('confirm');
      } else {
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAcceptMatch = () => {
    if (pendingTrackId && matchResult?.match) {
      seedKnowledge(pendingTrackId, matchResult.match, user!.id);
    }
    onClose();
  };

  const handleGenerateKnowledge = async () => {
    if (!pendingTrackId) return;
    setStep('generating');
    setGenerateLoading(true);
    try {
      const resp = await fetch('/api/generate-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), desc: desc.trim(), model: modelId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const seeds: { type: MemoryType; content: string; confidence: number }[] = data.seeds || [];
        if (seeds.length > 0) {
          seedCustomKnowledge(pendingTrackId, seeds, user!.id);
        }
        setGenerateSuccess(true);
        setStep('done');
      } else {
        // 生成失败，提示但不阻塞
        setGenerateSuccess(false);
        setStep('done');
      }
    } catch {
      setGenerateSuccess(false);
      setStep('done');
    } finally {
      setGenerateLoading(false);
    }
  };

  const hasGoodMatch = matchResult && matchResult.match && matchResult.confidence >= 0.5;

  // Knowledge flow steps (matching / confirm / generating / done)
  if (step !== 'form') {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-paper border-paper3 max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[15px]">
              {step === 'done' ? '知识库就绪' : '知识库配置'}
            </DialogTitle>
          </DialogHeader>

          {/* Matching loading */}
          {matchLoading && (
            <div className="flex items-center gap-3 py-6 text-ink3 text-sm justify-center">
              <div className="w-4 h-4 border-2 border-paper3 border-t-gold rounded-full animate-spin" />
              正在匹配最适合的知识库...
            </div>
          )}

          {/* Generating loading */}
          {step === 'generating' && generateLoading && (
            <div className="flex items-center gap-3 py-6 text-ink3 text-sm justify-center">
              <div className="w-4 h-4 border-2 border-paper3 border-t-gold rounded-full animate-spin" />
              正在为「{name}」生成专属知识库...
            </div>
          )}

          {/* Confirm: good match found */}
          {step === 'confirm' && hasGoodMatch && (
            <div className="space-y-3">
              <p className="text-sm text-ink2 leading-relaxed">
                为赛道「<span className="text-ink font-medium">{name}</span>」找到最接近的内置知识库：
              </p>
              <div className="bg-paper2 border border-paper3 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-ink">{matchResult!.matchName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold">
                    匹配度 {Math.round(matchResult!.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-ink3">{matchResult!.reason}</p>
              </div>
              <p className="text-xs text-ink3">
                使用该知识库后，AI 将获得该赛道的受众画像、爆款规律、合规红线等知识，生成质量更高。
              </p>
            </div>
          )}

          {/* Confirm: no match */}
          {step === 'confirm' && !hasGoodMatch && (
            <div className="space-y-3">
              <p className="text-sm text-ink2 leading-relaxed">
                赛道「<span className="text-ink font-medium">{name}</span>」暂未匹配到合适的内置知识库。
              </p>
              <p className="text-xs text-ink3 leading-relaxed">
                你可以让 AI 为这个赛道生成一套专属知识库（包含受众画像、爆款规律、合规红线等），也可以跳过，AI 会在创作过程中逐步学习。
              </p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="space-y-3 py-2">
              {generateSuccess ? (
                <>
                  <p className="text-sm text-ink2 leading-relaxed">
                    已为赛道「<span className="text-ink font-medium">{name}</span>」生成专属知识库。
                  </p>
                  <p className="text-xs text-ink3">
                    知识库已注入记忆系统，AI 会在创作时自动运用这些知识。
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink2 leading-relaxed">
                    知识库生成失败，但不影响正常使用。
                  </p>
                  <p className="text-xs text-ink3">
                    AI 会在创作过程中逐步学习该赛道的规律。
                  </p>
                </>
              )}
            </div>
          )}

          {/* Footer buttons */}
          {step === 'confirm' && (
            <DialogFooter>
              {hasGoodMatch ? (
                <>
                  <Button variant="outline" onClick={handleGenerateKnowledge} className="border-paper3 text-ink2">
                    不合适，生成新的
                  </Button>
                  <Button onClick={handleAcceptMatch} className="bg-ink text-gold2 border border-gold hover:bg-sidebar-hover">
                    使用该知识库
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} className="border-paper3 text-ink2">
                    跳过
                  </Button>
                  <Button onClick={handleGenerateKnowledge} className="bg-ink text-gold2 border border-gold hover:bg-sidebar-hover">
                    生成知识库
                  </Button>
                </>
              )}
            </DialogFooter>
          )}

          {step === 'done' && (
            <DialogFooter>
              <Button onClick={onClose} className="bg-ink text-gold2 border border-gold hover:bg-sidebar-hover">
                完成
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Main form step
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-paper border-paper3 max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[15px]">
            {editTrack ? '编辑赛道' : '新增赛道'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] tracking-[2px] text-ink3 uppercase block mb-1">赛道名称</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：道家养生、职场干货" maxLength={12} className="bg-paper2 border-paper3" />
          </div>
          <div>
            <label className="text-[11px] tracking-[2px] text-ink3 uppercase block mb-1">赛道描述</label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="例如：传统道家养生知识分享" maxLength={30} className="bg-paper2 border-paper3" />
          </div>
          <div>
            <label className="text-[11px] tracking-[2px] text-ink3 uppercase block mb-1">标志颜色</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-colors ${c === color ? 'border-gold' : 'border-transparent'}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] tracking-[2px] text-ink3 uppercase block mb-1">
              平台审核禁忌词 <span className="font-light text-ink3">（选填，逗号分隔）</span>
            </label>
            <Input value={banned} onChange={e => setBanned(e.target.value)} placeholder="例如：治疗,根治,特效,绝对" className="bg-paper2 border-paper3" />
          </div>
          <div>
            <label className="text-[11px] tracking-[2px] text-ink3 uppercase block mb-1">
              Few-shot 爆款参考文案 <span className="font-light text-ink3">（选填）</span>
            </label>
            <Textarea
              value={fewShot}
              onChange={e => setFewShot(e.target.value)}
              rows={4}
              placeholder={"把这个赛道里你觉得好的视频文案粘贴在这里\nAI会直接学习它的节奏和用词。"}
              className="bg-paper2 border-paper3"
            />
            <div className="text-[11px] text-ink3 mt-1 bg-[#faf7f1] p-2 rounded border-l-[3px] border-gold">
              粘贴真实爆款文案，比任何风格描述都管用。
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-paper3 text-ink2">取消</Button>
          <Button onClick={handleSave} className="bg-ink text-gold2 border border-gold hover:bg-sidebar-hover">保存赛道</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
