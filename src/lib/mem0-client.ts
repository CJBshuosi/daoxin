// src/lib/mem0-client.ts
import type { Mem0Memory, MemoryType } from '@/types';

async function callMemoryAPI(body: Record<string, unknown>, mem0ApiKey: string) {
  const resp = await fetch('/api/memory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mem0-key': mem0ApiKey,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(err.error || `记忆服务错误 ${resp.status}`);
  }
  return resp.json();
}

export async function searchMemories(
  query: string,
  userId: string,
  agentId: string,
  mem0ApiKey: string,
  limit = 15,
): Promise<Mem0Memory[]> {
  const data = await callMemoryAPI({
    action: 'search',
    query,
    user_id: userId,
    agent_id: agentId,
    limit,
  }, mem0ApiKey);
  return (data.results || data || []) as Mem0Memory[];
}

export async function addMemory(
  messages: { role: string; content: string }[],
  userId: string,
  agentId: string,
  mem0ApiKey: string,
  metadata?: { type?: MemoryType; source?: string; confidence?: number },
): Promise<Mem0Memory[]> {
  const data = await callMemoryAPI({
    action: 'add',
    messages,
    user_id: userId,
    agent_id: agentId,
    metadata,
  }, mem0ApiKey);
  return (data.results || data || []) as Mem0Memory[];
}

export async function updateMemory(
  memoryId: string,
  updateData: Record<string, unknown>,
  mem0ApiKey: string,
): Promise<void> {
  await callMemoryAPI({
    action: 'update',
    memory_id: memoryId,
    data: updateData,
  }, mem0ApiKey);
}

export async function deleteMemory(
  memoryId: string,
  mem0ApiKey: string,
): Promise<void> {
  await callMemoryAPI({
    action: 'delete',
    memory_id: memoryId,
  }, mem0ApiKey);
}

export async function listMemories(
  userId: string,
  agentId: string,
  mem0ApiKey: string,
): Promise<Mem0Memory[]> {
  const data = await callMemoryAPI({
    action: 'list',
    user_id: userId,
    agent_id: agentId,
  }, mem0ApiKey);
  return (data.results || data || []) as Mem0Memory[];
}
