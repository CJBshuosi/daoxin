// ===== Memory System =====

export type MemoryType = 'style' | 'content' | 'avoid' | 'pattern';

export interface MemoryEntry {
  id: string;
  trackId: string;           // 属于哪个赛道
  type: MemoryType;
  content: string;           // 规则内容
  source: 'ai' | 'user' | 'system';  // AI提取 / 用户手动 / 知识库种子
  confidence: number;        // 0.0 ~ 1.0
  hitCount: number;          // 被注入 prompt 的次数
  createdAt: number;
  updatedAt: number;
}

export const MEMORY_TYPE_META: Record<MemoryType, { label: string; color: string; desc: string }> = {
  style:   { label: '风格偏好', color: '#8b5cf6', desc: '写作风格、语气、表达方式' },
  content: { label: '内容偏好', color: '#3b82f6', desc: '喜欢的素材、引用、主题方向' },
  avoid:   { label: '需要避免', color: '#ef4444', desc: '不喜欢的表达、禁忌内容' },
  pattern: { label: '成功模式', color: '#10b981', desc: 'AI 发现的高效创作模式' },
};

// ===== Track =====

export interface TrackProfile {
  targetAudience: string;    // 目标受众画像，如"25-40岁都市白领，关注身心健康"
  persona: string;           // 账号人设，如"10年道家修行者，温和智慧的师兄形象"
  product: string;           // 变现方向，如"线下禅修课程、养生茶饮品牌合作"
  contentGoal: string;       // 内容目标，如"涨粉为主，建立专业形象"
}

export interface Track {
  id: string;
  name: string;
  desc: string;
  color: string;
  banned: string;
  fewShot: string;
  memories?: MemoryEntry[];  // 旧字段，兼容过渡（已迁移至 mem0）
  knowledgeId?: string;      // 绑定的内置知识库 ID（如 'guoxue'）
  knowledgeSeeded?: boolean; // 是否已完成种子注入
  profile?: TrackProfile;    // 赛道画像（首次生成时引导填写）
  profileCompleted?: boolean; // 是否已完成画像填写（含跳过）
  refAccounts: string[];
  count: number;
}

// ===== Generation =====

export interface AIMemoryExtraction {
  type: MemoryType;
  content: string;
}

export interface EmotionCurvePoint {
  section: string;
  emotion: string;
  intensity: number;
}

export interface ShootingGuide {
  opening: string;
  style: string;
  transitions: string;
}

export interface TopicOption {
  title: string;
  hook: string;
  hookType: string;
  executionPlan: string;
}

export interface GenerationResult {
  copytext: string;
  titles: string[];
  music: string[];
  emotionCurve?: EmotionCurvePoint[];
  shootingGuide?: ShootingGuide;
  structure?: string;
  memory_update?: string;           // 旧字段，兼容
  memory_entries?: AIMemoryExtraction[];
}

// ===== Agent Pipeline (Phase 2) =====

export interface QualityScore {
  dimension: string;
  score: number;
  comment: string;
  suggestion?: string;
}

export interface CheckerResult {
  scores: QualityScore[];
  totalScore: number;
  overallSuggestion: string;
  pass: boolean;
}

// ===== mem0 Memory (Phase 3) =====

export interface Mem0Memory {
  id: string;
  memory: string;
  agent_id?: string;
  user_id?: string;
  metadata: {
    type?: MemoryType;
    source?: 'ai' | 'user' | 'system';
    confidence?: number;
    hit_count?: number;
  };
  created_at: string;
  updated_at: string;
}

// ===== History =====

export interface HistoryItem {
  id: string;
  trackId: string;
  trackName: string;
  trackColor: string;
  prompt: string;
  result: GenerationResult;
  createdAt: number;
  usedMemoryIds?: string[];   // memory IDs injected during generation
  strategy?: StrategyType;    // strategy used for this generation
}

// ===== 道心四法策略 =====

export type StrategyType = 'mingdao' | 'dongxin' | 'qisi' | 'poju';

export const STRATEGY_META: Record<StrategyType, { name: string; desc: string; goal: string; subDirections: string[] }> = {
  mingdao: {
    name: '明道·洞见',
    desc: '以认知落差驱动传播 — "原来如此"',
    goal: '完播率、收藏、涨粉',
    subDirections: ['认知颠覆', '深层规律', '趋势洞察', '数据揭秘'],
  },
  dongxin: {
    name: '动心·共鸣',
    desc: '以情感共振驱动互动 — "说的就是我"',
    goal: '点赞、评论、转发',
    subDirections: ['情感共鸣', '身份认同', '态度表达', '故事感动'],
  },
  qisi: {
    name: '启思·价值',
    desc: '以实用价值驱动收藏 — "学到了"',
    goal: '收藏、关注、完播',
    subDirections: ['干货输出', '痛点解决', '经验复盘', '对比测评'],
  },
  poju: {
    name: '破局·创意',
    desc: '以新奇视角驱动破圈 — "没想到还能这样"',
    goal: '转发、出圈、涨粉',
    subDirections: ['跨界联想', '极端假设', '时空穿越', '逆向思维', '视角转换'],
  },
};

export interface StepState {
  step: 1 | 2 | 3 | 4 | 5;
  topic: string;
  topicAnalysis?: string;
  targetGoal?: string;
  strategy?: StrategyType;
  subDirection?: string;
  topics?: TopicOption[];
  selectedTopic?: number;
  result?: GenerationResult;
  // Phase 2: Agent pipeline state
  checkerResult?: CheckerResult;
  optimizeCount?: number;
  step4Phase?: 'writing' | 'metadata' | 'checking' | 'done';
}
