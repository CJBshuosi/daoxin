# Phase 3: mem0 记忆系统替换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the keyword-matching memory system with mem0 Cloud API for semantic memory — search, add, update, delete — while preserving the existing memory type taxonomy, UI, and calibration loop.

**Architecture:** A server-side API route (`/api/memory`) proxies all mem0 Cloud calls, receiving the mem0 API key via request header (same pattern as AI provider keys). A client-side `mem0-client.ts` wraps fetch calls to this route. `memory.ts` is rewritten: `buildMemoryPrompt` becomes async and calls mem0 search. The store drops local merge/decay/similarity logic, delegating to mem0's built-in semantic dedup. Components adapt to async data fetching.

**Tech Stack:** Next.js 15 App Router, mem0 REST API (api.mem0.ai), Zustand, Supabase Auth, TypeScript

---

## File Structure

| File | Responsibility |
|---|---|
| `src/store/useSettingsStore.ts` | Add `mem0ApiKey` field |
| `src/components/settings/SettingsPage.tsx` | Add mem0 API Key input in settings UI |
| `src/app/api/memory/route.ts` | **New**: server-side proxy to mem0 Cloud API (search/add/update/delete/list) |
| `src/lib/mem0-client.ts` | **New**: client-side wrapper calling `/api/memory` |
| `src/types/index.ts` | Add `Mem0Memory` interface |
| `src/lib/memory.ts` | **Rewrite**: async `buildMemoryPrompt` using mem0 search; remove local merge/decay/similarity |
| `src/store/useTrackStore.ts` | Replace local memory CRUD with mem0-client calls |
| `src/components/generation/StepCards/StepContainer.tsx` | Adapt to async `buildMemoryPrompt` |
| `src/components/memory/MemoryDisplay.tsx` | Fetch memories from mem0 via client |
| `src/components/memory/MemoryEditModal.tsx` | CRUD operations via mem0-client |
| `src/lib/calibration.ts` | Update confidence via mem0-client |

---

### Task 1: Add mem0 API key to settings

**Files:**
- Modify: `src/store/useSettingsStore.ts`
- Modify: `src/components/settings/SettingsPage.tsx`

- [ ] **Step 1: Add mem0ApiKey to settings store**

In `src/store/useSettingsStore.ts`, add a `mem0ApiKey` field and setter.

Add to the interface:
```typescript
  mem0ApiKey: string;
  setMem0ApiKey: (key: string) => void;
```

Add to the store creation, after the `baseUrls` initial value:
```typescript
  mem0ApiKey: '',
```

Add the setter method, after `setBaseUrl`:
```typescript
  setMem0ApiKey: (key) => set({ mem0ApiKey: key }),
```

- [ ] **Step 2: Add mem0 API Key input to SettingsPage**

In `src/components/settings/SettingsPage.tsx`, add a new section for mem0 configuration. Read the file first to understand the existing UI pattern (it uses inline styles with the warm paper palette).

After the existing model configuration sections, add a new "记忆系统" section with:
- A section header "记忆系统 (mem0)"
- An API Key input field (password type with show/hide toggle, same pattern as existing API key inputs)
- A help text: "用于语义记忆检索，可在 mem0.ai 获取 API Key"

Use the same `mem0ApiKey` / `setMem0ApiKey` from the settings store.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/store/useSettingsStore.ts src/components/settings/SettingsPage.tsx
git commit -m "feat: add mem0 API key to settings store and UI"
```

---

### Task 2: Add Mem0Memory type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Mem0Memory interface**

In `src/types/index.ts`, add after the existing `CheckerResult` interface:

```typescript
// ===== mem0 Memory (Phase 3) =====

export interface Mem0Memory {
  id: string;
  memory: string;
  metadata: {
    type?: MemoryType;
    source?: 'ai' | 'user' | 'system';
    confidence?: number;
    hit_count?: number;
  };
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Mem0Memory type for Phase 3"
```

---

### Task 3: Create server-side mem0 API route

**Files:**
- Create: `src/app/api/memory/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/memory/route.ts
import { NextRequest } from 'next/server';

const MEM0_BASE_URL = 'https://api.mem0.ai/v1';

async function mem0Fetch(path: string, apiKey: string, options: RequestInit = {}) {
  const resp = await fetch(`${MEM0_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`,
      ...options.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`mem0 API error ${resp.status}: ${text}`);
  }
  // DELETE returns 204 no content
  if (resp.status === 204) return null;
  return resp.json();
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-mem0-key') || '';
  if (!apiKey) {
    return Response.json({ error: '未配置 mem0 API Key' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case 'search': {
        const { query, user_id, agent_id, limit = 15 } = body;
        const data = await mem0Fetch('/memories/search/', apiKey, {
          method: 'POST',
          body: JSON.stringify({ query, user_id, agent_id, limit }),
        });
        return Response.json(data);
      }

      case 'add': {
        const { messages, user_id, agent_id, metadata } = body;
        const data = await mem0Fetch('/memories/', apiKey, {
          method: 'POST',
          body: JSON.stringify({ messages, user_id, agent_id, metadata }),
        });
        return Response.json(data);
      }

      case 'update': {
        const { memory_id, data: updateData } = body;
        const data = await mem0Fetch(`/memories/${memory_id}/`, apiKey, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        return Response.json(data);
      }

      case 'delete': {
        const { memory_id } = body;
        await mem0Fetch(`/memories/${memory_id}/`, apiKey, {
          method: 'DELETE',
        });
        return Response.json({ success: true });
      }

      case 'list': {
        const { user_id, agent_id } = body;
        const params = new URLSearchParams();
        if (user_id) params.set('user_id', user_id);
        if (agent_id) params.set('agent_id', agent_id);
        const data = await mem0Fetch(`/memories/?${params.toString()}`, apiKey, {
          method: 'GET',
        });
        return Response.json(data);
      }

      default:
        return Response.json({ error: `未知 action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : '记忆服务请求失败';
    return Response.json({ error: message }, { status: 502 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/memory/route.ts
git commit -m "feat: create server-side mem0 API proxy route"
```

---

### Task 4: Create client-side mem0 wrapper

**Files:**
- Create: `src/lib/mem0-client.ts`

- [ ] **Step 1: Create the client**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/mem0-client.ts
git commit -m "feat: create mem0 client wrapper for memory operations"
```

---

### Task 5: Rewrite memory.ts for mem0

**Files:**
- Modify: `src/lib/memory.ts`

The key change: `buildMemoryPrompt` becomes async, calling mem0 search instead of local scoring. Local merge/decay/similarity functions are removed (mem0 handles these semantically). We keep `buildMemoryPromptFromEntries` as a sync formatter for backward compatibility with any code that already has memories in hand.

- [ ] **Step 1: Rewrite the entire file**

Replace the entire content of `src/lib/memory.ts` with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Will show errors in files that import the old functions (StepContainer, useTrackStore). This is expected — they'll be fixed in Tasks 6 and 7.

- [ ] **Step 3: Commit**

```bash
git add src/lib/memory.ts
git commit -m "feat: rewrite memory.ts for mem0 semantic search"
```

---

### Task 6: Update StepContainer for async memory

**Files:**
- Modify: `src/components/generation/StepCards/StepContainer.tsx`

The main change: replace all `buildMemoryPrompt(currentTrack.memories || [], topic)` sync calls with the new async `buildMemoryPrompt(topic, userId, trackId, mem0ApiKey)`.

- [ ] **Step 1: Update imports and add mem0 dependencies**

Read the current file first. Replace the memory import:

```typescript
import { buildMemoryPrompt } from '@/lib/memory';
```
With:
```typescript
import { buildMemoryPrompt } from '@/lib/memory';
```

(Same import name, but now it's async.)

Add settings store import for mem0ApiKey. Find the existing `useSettingsStore` usage and add `mem0ApiKey`:

```typescript
  const mem0ApiKey = useSettingsStore(s => s.mem0ApiKey);
```

- [ ] **Step 2: Update runStep1**

In the `runStep1` callback, find:
```typescript
      const [searchContext, memoryResult] = await Promise.all([
        fetchSearchContext(topic),
        Promise.resolve(buildMemoryPrompt(currentTrack.memories || [], topic)),
      ]);
```

Replace with:
```typescript
      const [searchContext, memoryResult] = await Promise.all([
        fetchSearchContext(topic),
        buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey),
      ]);
```

- [ ] **Step 3: Update runStep3**

In `runStep3`, find:
```typescript
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
```

Replace with:
```typescript
      const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
```

- [ ] **Step 4: Update runStep4**

In `runStep4`, find:
```typescript
    const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
```

Replace with:
```typescript
    const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
```

- [ ] **Step 5: Update runOptimize**

In `runOptimize`, find:
```typescript
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
```

Replace with:
```typescript
      const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
```

- [ ] **Step 6: Update runPolish**

In `runPolish`, find:
```typescript
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
```

Replace with:
```typescript
      const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
```

- [ ] **Step 7: Update handleConfirm to add memories via mem0**

In `handleConfirm`, replace the memory merge logic. Find:
```typescript
    if (finalResult.memory_entries && finalResult.memory_entries.length > 0) {
      mergeAIMemoryEntries(currentTrack.id, finalResult.memory_entries, user!.id);
    }
```

Replace with:
```typescript
    if (finalResult.memory_entries && finalResult.memory_entries.length > 0 && mem0ApiKey) {
      // Fire-and-forget: add AI-extracted memories to mem0
      import('@/lib/mem0-client').then(({ addMemory }) => {
        for (const entry of finalResult.memory_entries!) {
          addMemory(
            [{ role: 'assistant', content: entry.content }],
            user!.id,
            currentTrack.id,
            mem0ApiKey,
            { type: entry.type, source: 'ai', confidence: 0.4 },
          ).catch(console.warn);
        }
      });
    }
```

Also remove the `mergeAIMemoryEntries` from the destructured store values (near the top of the component) if it's no longer used. Keep `runDecay` and `incrementCount` as they still serve other purposes.

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: May still show errors from useTrackStore (old memory methods). Continue to Task 7.

- [ ] **Step 9: Commit**

```bash
git add src/components/generation/StepCards/StepContainer.tsx
git commit -m "feat: update StepContainer for async mem0 memory search"
```

---

### Task 7: Update useTrackStore — remove local memory logic

**Files:**
- Modify: `src/store/useTrackStore.ts`

The store's memory CRUD methods need to call mem0 instead of manipulating local arrays. Since mem0 handles merge/dedup semantically, we can simplify greatly.

- [ ] **Step 1: Read the current file and understand the memory methods**

Read `src/store/useTrackStore.ts` in full. Identify all memory-related methods:
- `addMemoryEntry` — keep, but call mem0 `addMemory` instead of local push
- `updateMemoryEntry` — keep, but call mem0 `updateMemory`
- `deleteMemoryEntry` — keep, but call mem0 `deleteMemory`
- `mergeAIMemoryEntries` — remove (replaced by direct mem0 add in StepContainer)
- `boostMemory` — keep, call mem0 `updateMemory` with metadata
- `runDecay` — remove (mem0 handles relevance internally)
- `seedKnowledge` / `seedCustomKnowledge` — keep but adapt to call mem0

- [ ] **Step 2: Add mem0 imports and update methods**

At the top, add:
```typescript
import { addMemory, updateMemory, deleteMemory } from '@/lib/mem0-client';
```

For `addMemoryEntry`, change it to also call mem0. The method should:
1. Keep the local array update for immediate UI response
2. Also fire-and-forget call to `addMemory()` for persistence

For `deleteMemoryEntry`, add a fire-and-forget call to `deleteMemory()`.

For `boostMemory`, add a fire-and-forget call to `updateMemory()` with the new confidence in metadata.

Remove `mergeAIMemoryEntries` method and `runDecay` method (no longer needed).

**Important:** The mem0ApiKey is in useSettingsStore, not useTrackStore. The methods need to get it from useSettingsStore. Add at the top of each method that calls mem0:
```typescript
const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
```

Import useSettingsStore:
```typescript
import { useSettingsStore } from './useSettingsStore';
```

- [ ] **Step 3: Remove old memory.ts imports**

Remove imports of `mergeAIMemories`, `decayMemories`, and other removed functions from `@/lib/memory`.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS (or close — remaining issues will be in memory components)

- [ ] **Step 5: Commit**

```bash
git add src/store/useTrackStore.ts
git commit -m "feat: update track store to use mem0 for memory operations"
```

---

### Task 8: Update MemoryDisplay and MemoryEditModal

**Files:**
- Modify: `src/components/memory/MemoryDisplay.tsx`
- Modify: `src/components/memory/MemoryEditModal.tsx`

- [ ] **Step 1: Update MemoryDisplay**

Read `src/components/memory/MemoryDisplay.tsx`. The component currently receives `memories: MemoryEntry[]` as a prop and renders them.

Change it to also accept `Mem0Memory[]` format. The simplest approach: add a data normalization layer. Add a helper at the top:

```typescript
import type { Mem0Memory } from '@/types';

function normalizeMem0(mem: Mem0Memory): { id: string; type: string; content: string; confidence: number; source: string } {
  return {
    id: mem.id,
    type: mem.metadata?.type || 'content',
    content: mem.memory,
    confidence: mem.metadata?.confidence ?? 0.5,
    source: mem.metadata?.source || 'ai',
  };
}
```

Add a prop for mem0 memories alongside the existing prop. The component should render whichever list is provided, preferring mem0 memories when available.

- [ ] **Step 2: Update MemoryEditModal**

Read `src/components/memory/MemoryEditModal.tsx`. It currently calls `addMemoryEntry`, `updateMemoryEntry`, `deleteMemoryEntry`, `boostMemory` from the track store.

These store methods still exist (updated in Task 7), so the modal should largely still work. The main change: if mem0 memories are being displayed, the delete/edit operations need to use the mem0 memory ID.

Add a new prop `mem0Memories?: Mem0Memory[]` and render those when provided. The CRUD callbacks from the store already proxy to mem0 (Task 7), so no additional changes needed for the operations themselves.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/memory/MemoryDisplay.tsx src/components/memory/MemoryEditModal.tsx
git commit -m "feat: adapt memory components for mem0 data format"
```

---

### Task 9: Update calibration.ts for mem0

**Files:**
- Modify: `src/lib/calibration.ts`

- [ ] **Step 1: Update calibrateMemories**

Read `src/lib/calibration.ts`. The function currently returns `{ memoryId, delta }[]` for the caller to apply. Update it to also accept a mem0ApiKey parameter and directly call `updateMemory` when provided.

Add at the top:
```typescript
import { updateMemory } from './mem0-client';
```

Modify the function signature to add `mem0ApiKey?: string` parameter. After computing the deltas, if mem0ApiKey is provided, fire-and-forget update calls:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/calibration.ts
git commit -m "feat: update calibration to persist confidence via mem0"
```

---

### Task 10: Final build verification

**Files:**
- No new files

- [ ] **Step 1: Full build verification**

Run: `npm run build`
Expected: Build succeeds, all routes compile (including new `/api/memory`)

- [ ] **Step 2: Verify git log**

Run: `git log --oneline -10`
Expected: Phase 3 commits visible

- [ ] **Step 3: Final commit if needed**

```bash
git status
# If any unstaged changes:
git add -A
git commit -m "feat: complete Phase 3 — mem0 memory system integration"
```

---

## Self-Review

**Spec coverage check:**
- [x] mem0 Cloud API integration — Task 3 (server route) + Task 4 (client wrapper)
- [x] mem0 API Key in settings — Task 1
- [x] Semantic memory search replaces keyword matching — Task 5 (memory.ts rewrite)
- [x] Data model mapping (user_id, agent_id, metadata) — Task 3/4 use spec mappings
- [x] buildMemoryPrompt becomes async — Task 5
- [x] StepContainer adapted — Task 6
- [x] Store CRUD → mem0 — Task 7
- [x] Memory components adapted — Task 8
- [x] Calibration → mem0 update — Task 9
- [x] Graceful degradation when mem0 unavailable — Task 5 (try/catch returns empty)
- [x] MemoryType taxonomy preserved — Task 5 (formatMemoryPrompt groups by type)
- [ ] ~~Data migration from Supabase~~ — **Deferred**: Migration requires careful testing with real data. The current approach preserves Supabase memories as-is; new memories go to mem0. A migration script can be added separately when needed.

**Placeholder scan:** No TBD/TODO found. Task 7 Step 2 and Task 8 Steps 1-2 describe changes at a higher level than usual because the exact edits depend on reading the current file state — but the instructions are specific enough for an implementer to execute.

**Type consistency:** `Mem0Memory` used consistently across all tasks. `mem0ApiKey` parameter name consistent. `searchMemories`/`addMemory`/`updateMemory`/`deleteMemory`/`listMemories` function names match between Task 4 (definition) and Tasks 5-9 (usage).
