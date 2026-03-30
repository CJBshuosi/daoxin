import type { MemoryEntry } from '@/types';
import type { PerformanceLevel } from '@/types/performance';

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
): { memoryId: string; delta: number }[] {
  const delta = LEVEL_DELTA[level];
  if (delta === 0 || usedMemoryIds.length === 0) return [];

  return usedMemoryIds
    .filter(id => {
      const m = trackMemories.find(mem => mem.id === id);
      // Skip user-created memories — they shouldn't be auto-calibrated
      return m && m.source !== 'user';
    })
    .map(id => ({ memoryId: id, delta }));
}
