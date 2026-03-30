import type { MemoryEntry, MemoryType, AIMemoryExtraction } from '@/types';

// ===== ID 生成 =====

export function genMemoryId() {
  return 'm' + Date.now() + Math.random().toString(36).slice(2, 6);
}

// ===== 中文分词（浏览器原生） =====

function segmentWords(text: string): Set<string> {
  // 使用 Intl.Segmenter 进行中文分词（现代浏览器均支持）
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
    const words = new Set<string>();
    for (const { segment, isWordLike } of segmenter.segment(text)) {
      if (isWordLike && segment.length > 1) {
        words.add(segment);
      }
    }
    return words;
  }
  // Fallback: 2-gram
  const words = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) {
    words.add(text.slice(i, i + 2));
  }
  return words;
}

// ===== 相似度计算 =====

export function calculateSimilarity(a: string, b: string): number {
  const wordsA = segmentWords(a);
  const wordsB = segmentWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}

// ===== 智能合并 =====

export function mergeAIMemories(
  existing: MemoryEntry[],
  trackId: string,
  newEntries: AIMemoryExtraction[],
): MemoryEntry[] {
  const result = [...existing];

  for (const entry of newEntries) {
    // 在同类型记忆中找最相似的
    const sameType = result.filter(m => m.trackId === trackId && m.type === entry.type);
    let bestMatch: { index: number; similarity: number } | null = null;

    for (let i = 0; i < sameType.length; i++) {
      const sim = calculateSimilarity(entry.content, sameType[i].content);
      if (!bestMatch || sim > bestMatch.similarity) {
        const globalIdx = result.indexOf(sameType[i]);
        bestMatch = { index: globalIdx, similarity: sim };
      }
    }

    const now = Date.now();

    if (bestMatch && bestMatch.similarity > 0.7) {
      // 高相似度 → 合并：提升 confidence
      const m = result[bestMatch.index];
      result[bestMatch.index] = {
        ...m,
        confidence: Math.min(1.0, m.confidence + 0.15),
        hitCount: m.hitCount + 1,
        updatedAt: now,
      };
    } else if (bestMatch && bestMatch.similarity > 0.4) {
      // 中等相似度 → 更新内容
      const m = result[bestMatch.index];
      result[bestMatch.index] = {
        ...m,
        content: entry.content,
        confidence: Math.min(1.0, m.confidence + 0.05),
        updatedAt: now,
      };
    } else {
      // 新记忆
      result.push({
        id: genMemoryId(),
        trackId,
        type: entry.type,
        content: entry.content,
        source: 'ai',
        confidence: 0.4,
        hitCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 每个赛道最多 50 条
  const trackMemories = result.filter(m => m.trackId === trackId);
  if (trackMemories.length > 50) {
    const sorted = [...trackMemories].sort((a, b) => a.confidence - b.confidence);
    const toRemove = new Set(sorted.slice(0, trackMemories.length - 50).map(m => m.id));
    return result.filter(m => !toRemove.has(m.id));
  }

  return result;
}

// ===== 相关性评分 =====

function daysSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

function scoreMemory(memory: MemoryEntry, topic: string): number {
  const confidenceWeight = memory.confidence;
  const recencyWeight = 1 / (1 + daysSince(memory.updatedAt) / 30);
  const sourceWeight = memory.source === 'user' ? 1.3 : memory.source === 'system' ? 1.1 : 1.0;

  // 简单主题相关性：检查记忆内容中是否包含主题的关键词
  const topicWords = segmentWords(topic);
  const memWords = segmentWords(memory.content);
  let overlap = 0;
  for (const w of topicWords) {
    if (memWords.has(w)) overlap++;
  }
  const topicWeight = topicWords.size > 0 ? 1.0 + (overlap / topicWords.size) * 0.5 : 1.0;

  return confidenceWeight * recencyWeight * sourceWeight * topicWeight;
}

// ===== 构建记忆 Prompt =====

export function buildMemoryPrompt(memories: MemoryEntry[], topic: string, maxEntries = 15): { prompt: string; usedIds: string[] } {
  if (memories.length === 0) return { prompt: '', usedIds: [] };

  // 按评分排序，取 top-N
  const scored = memories
    .map(m => ({ ...m, score: scoreMemory(m, topic) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries);

  const usedIds = scored.map(m => m.id);

  if (scored.length === 0) return { prompt: '', usedIds: [] };

  // 按类型分组
  const grouped: Record<string, typeof scored> = {};
  for (const m of scored) {
    (grouped[m.type] ||= []).push(m);
  }

  const typeLabels: Record<MemoryType, string> = {
    style: '风格偏好',
    content: '内容偏好',
    avoid: '必须避免',
    pattern: '成功模式',
  };

  let prompt = '【用户偏好记忆】\n';
  for (const type of ['style', 'content', 'avoid', 'pattern'] as MemoryType[]) {
    const items = grouped[type];
    if (items?.length) {
      prompt += `${typeLabels[type]}：\n`;
      for (const m of items) {
        prompt += `- ${m.content}\n`;
      }
    }
  }

  return { prompt, usedIds };
}

// ===== 衰减 =====

export function decayMemories(memories: MemoryEntry[], trackId: string): MemoryEntry[] {
  const now = Date.now();
  return memories
    .map(m => {
      if (m.trackId !== trackId || m.source === 'user') return m;
      const days = daysSince(m.updatedAt);
      if (days <= 60) return m;
      const newConf = m.confidence * 0.95;
      return { ...m, confidence: newConf };
    })
    .filter(m => m.confidence >= 0.1);
}

// ===== 迁移：旧 memory string → MemoryEntry[] =====

export function migrateOldMemory(trackId: string, oldMemory: string): MemoryEntry[] {
  if (!oldMemory.trim()) return [];

  const lines = oldMemory.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const now = Date.now();

  return lines.map((line, i) => ({
    id: genMemoryId() + i,
    trackId,
    type: 'content' as MemoryType,
    content: line.replace(/^[-·•]\s*/, ''),
    source: 'ai' as const,
    confidence: 0.5,
    hitCount: 0,
    createdAt: now - (lines.length - i) * 60000, // 间隔1分钟
    updatedAt: now - (lines.length - i) * 60000,
  }));
}
