'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTrackStore } from '@/store/useTrackStore';
import type { Track, TrackProfile } from '@/types';

interface TrackProfileModalProps {
  open: boolean;
  track: Track;
  onClose: () => void;
  onComplete: () => void;
}

const FIELDS: { key: keyof TrackProfile; label: string; placeholder: string; hint: string }[] = [
  {
    key: 'targetAudience',
    label: '目标受众',
    placeholder: '例如：25-40岁都市白领，关注身心健康和传统文化',
    hint: '你的视频主要给谁看？年龄、身份、兴趣、痛点',
  },
  {
    key: 'persona',
    label: '账号人设',
    placeholder: '例如：10年修行经验的道家师兄，温和智慧，接地气',
    hint: '观众心中你是什么角色？专家/朋友/导师/体验者',
  },
  {
    key: 'product',
    label: '变现方向',
    placeholder: '例如：线下禅修课程引流、养生茶饮品牌合作',
    hint: '你靠什么赚钱？留空表示暂无明确变现计划',
  },
  {
    key: 'contentGoal',
    label: '内容目标',
    placeholder: '例如：涨粉为主，建立专业可信赖的形象',
    hint: '当前阶段最重要的目标：涨粉/互动/变现/品牌',
  },
];

export default function TrackProfileModal({ open, track, onClose, onComplete }: TrackProfileModalProps) {
  const updateTrack = useTrackStore(s => s.updateTrack);
  const [form, setForm] = useState<TrackProfile>({
    targetAudience: track.profile?.targetAudience || '',
    persona: track.profile?.persona || '',
    product: track.profile?.product || '',
    contentGoal: track.profile?.contentGoal || '',
  });

  const handleSave = () => {
    const hasContent = Object.values(form).some(v => v.trim());
    updateTrack(track.id, {
      profile: hasContent ? form : undefined,
      profileCompleted: true,
    });
    onComplete();
  };

  const handleSkip = () => {
    updateTrack(track.id, { profileCompleted: true });
    onComplete();
  };

  const isEditing = !!track.profileCompleted;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-paper border-paper3 max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[15px]">
            {isEditing ? '编辑赛道画像' : '完善赛道画像'}
          </DialogTitle>
        </DialogHeader>

        {!isEditing && (
          <p className="text-xs text-ink3 -mt-1 leading-relaxed">
            填写后 AI 会根据你的受众和人设生成更精准的内容。可以先跳过，之后随时补充。
          </p>
        )}

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {FIELDS.map(field => (
            <div key={field.key}>
              <label className="text-[11px] tracking-[2px] text-ink3 uppercase block mb-1">
                {field.label}
              </label>
              <Textarea
                value={form[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={2}
                className="bg-paper2 border-paper3 text-sm resize-none"
              />
              <div className="text-[10px] text-ink3 mt-0.5">{field.hint}</div>
            </div>
          ))}
        </div>

        <DialogFooter>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="border-paper3 text-ink3"
            >
              先跳过
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="border-paper3 text-ink2"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="bg-ink text-gold2 border border-gold hover:bg-sidebar-hover"
          >
            {isEditing ? '保存' : '完成设置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
