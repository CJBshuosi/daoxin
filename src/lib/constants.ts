import type { Track } from '@/types';

export const STORAGE_KEY = 'daoxin_v1';

export const COLORS = [
  '#5a7a5a', '#7a5a3a', '#4a5a7a', '#8b4513', '#6a4a7a',
  '#4a7a7a', '#7a4a4a', '#7a7a3a', '#3a5a7a', '#7a5a6a',
];

export const DEFAULT_TRACKS: Omit<Track, 'id'>[] = [
  { name: '道家养生', desc: '传统道家养生知识', color: '#5a7a5a', banned: '治疗,根治,特效', fewShot: '', memory: '', memories: [], refAccounts: [], count: 0 },
  { name: '国学',     desc: '经典国学智慧分享', color: '#7a5a3a', banned: '',                fewShot: '', memory: '', memories: [], refAccounts: [], count: 0 },
  { name: '修心',     desc: '内心成长与冥想',   color: '#4a5a7a', banned: '',                fewShot: '', memory: '', memories: [], refAccounts: [], count: 0 },
];

