import type { Track } from '@/types';

export const STORAGE_KEY = 'daoxin_v1';

/**
 * Custom instructions for mem0's LLM extraction layer.
 * Ensures Chinese output and maps to our 4 memory types.
 */
export const MEM0_CUSTOM_INSTRUCTIONS = `你是小红书文案偏好提取助手。从对话中提取用户的写作偏好记忆。必须满足以下规则：

1. **输出语言必须是简体中文**，严禁使用英文或翻译。
2. 每条记忆必须具体可执行，例如"用户偏好第一人称口语化标题"而非"用户喜欢好标题"。
3. 分类到以下四类之一：
   - style（写作风格/语气/人称）
   - content（内容结构/主题偏好）
   - avoid（必须避免的措辞或形式）
   - pattern（成功的创作模式）
4. 忽略一次性的具体需求（如"这次写咖啡店"），只提炼可复用的偏好。
5. 如果用户做了编辑或否决，从编辑 diff 中推断偏好。`;

export const COLORS = [
  '#5a7a5a', '#7a5a3a', '#4a5a7a', '#8b4513', '#6a4a7a',
  '#4a7a7a', '#7a4a4a', '#7a7a3a', '#3a5a7a', '#7a5a6a',
];

export const DEFAULT_TRACKS: Omit<Track, 'id'>[] = [
  { name: '道家养生', desc: '传统道家养生知识', color: '#5a7a5a', banned: '治疗,根治,特效', fewShot: '', refAccounts: [], count: 0 },
  { name: '国学',     desc: '经典国学智慧分享', color: '#7a5a3a', banned: '',                fewShot: '', refAccounts: [], count: 0 },
  { name: '修心',     desc: '内心成长与冥想',   color: '#4a5a7a', banned: '',                fewShot: '', refAccounts: [], count: 0 },
];

