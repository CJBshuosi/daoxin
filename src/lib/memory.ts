import type { MemoryType, Mem0Memory } from '@/types';
import { searchMemories } from './mem0-client';

// ===== Format mem0 results into a prompt string =====

const typeLabels: Record<MemoryType, string> = {
  style: '风格偏好',
  content: '内容偏好',
  avoid: '必须避免',
  pattern: '成功模式',
};

/**
 * Format a list of Mem0Memory entries into a prompt string.
 * Used after search results are returned.
 */
export function formatMemoryPrompt(memories: Mem0Memory[]): string {
  if (memories.length === 0) return '';

  // Group by type
  const grouped: Record<string, Mem0Memory[]> = {};
  for (const m of memories) {
    const type = m.metadata?.type || 'content';
    (grouped[type] ||= []).push(m);
  }

  let prompt = '【用户偏好记忆】\n';
  for (const type of ['style', 'content', 'avoid', 'pattern'] as MemoryType[]) {
    const items = grouped[type];
    if (items?.length) {
      prompt += `${typeLabels[type]}：\n`;
      for (const m of items) {
        prompt += `- ${m.memory}\n`;
      }
    }
  }

  // Include untyped memories
  const untyped = memories.filter(m => !m.metadata?.type || !['style', 'content', 'avoid', 'pattern'].includes(m.metadata.type as string));
  if (untyped.length > 0) {
    prompt += `其他记忆：\n`;
    for (const m of untyped) {
      prompt += `- ${m.memory}\n`;
    }
  }

  return prompt;
}

/**
 * Search mem0 for relevant memories and build a prompt string.
 * Returns empty prompt if mem0 is not configured or fails.
 */
export async function buildMemoryPrompt(
  query: string,
  userId: string,
  trackId: string,
  mem0ApiKey: string,
  limit = 15,
): Promise<{ prompt: string; usedIds: string[] }> {
  if (!mem0ApiKey) {
    return { prompt: '', usedIds: [] };
  }

  try {
    const memories = await searchMemories(query, userId, trackId, mem0ApiKey, limit);
    const usedIds = memories.map(m => m.id);
    const prompt = formatMemoryPrompt(memories);
    return { prompt, usedIds };
  } catch {
    // Graceful degradation: continue without memory if mem0 is unavailable
    console.warn('mem0 search failed, continuing without memory');
    return { prompt: '', usedIds: [] };
  }
}
