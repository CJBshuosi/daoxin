import type { MemoryEntry } from '@/types';
import type { PerformanceLevel } from '@/types/performance';
import { updateMemory } from './mem0-client';

const LEVEL_DELTA: Record<PerformanceLevel, number> = {
  excellent: 0.15,
  good: 0.05,
  average: 0,
  poor: -0.10,
};

export function calibrateMemories(
  level: PerformanceLevel,
  usedMemoryIds: string[],
  trackMemories: MemoryEntry[],
  mem0ApiKey?: string,
): { memoryId: string; delta: number }[] {
  const delta = LEVEL_DELTA[level];
  if (delta === 0 || usedMemoryIds.length === 0) return [];

  const result = usedMemoryIds
    .filter(id => {
      const m = trackMemories.find(mem => mem.id === id);
      // Skip user-created memories — they shouldn't be auto-calibrated
      return m && m.source !== 'user';
    })
    .map(id => ({ memoryId: id, delta }));

  if (mem0ApiKey) {
    for (const { memoryId, delta } of result) {
      if (delta !== 0) {
        // Find current confidence from the memory list, apply delta
        const mem = trackMemories.find(m => m.id === memoryId);
        if (mem) {
          const newConf = Math.max(0.05, Math.min(1.0, (mem.confidence || 0.5) + delta));
          updateMemory(memoryId, { metadata: { confidence: newConf } }, mem0ApiKey).catch(console.warn);
        }
      }
    }
  }

  return result;
}
