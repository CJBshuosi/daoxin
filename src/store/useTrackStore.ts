'use client';

import { create } from 'zustand';
import type { Track, MemoryEntry, MemoryType, HistoryItem } from '@/types';
import { getBuiltinTrack } from '@/lib/knowledge-seeds';
import { createClient } from '@/lib/supabase/client';
import { addMemory, updateMemory, deleteMemory } from '@/lib/mem0-client';
import { MEM0_CUSTOM_INSTRUCTIONS } from '@/lib/constants';
import { useSettingsStore } from './useSettingsStore';

function genId() {
  return 't' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function genMemoryId() {
  return 'm' + Date.now() + Math.random().toString(36).slice(2, 8);
}

const MAX_HISTORY = 200;

interface TrackStore {
  tracks: Track[];
  currentId: string | null;
  history: HistoryItem[];
  hydrated: boolean;

  // Hydrate from Supabase after login
  hydrate: (userId: string) => Promise<void>;

  // History actions
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
  deleteHistoryItem: (id: string) => void;
  clearTrackHistory: (trackId: string) => void;

  // Track actions
  selectTrack: (id: string) => void;
  addTrack: (data: Omit<Track, 'id'>, userId: string) => Promise<string>;
  updateTrack: (id: string, data: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  getTrack: (id: string | null) => Track | undefined;
  getCurrentTrack: () => Track | undefined;
  incrementCount: (id: string) => void;

  // Structured memory actions
  seedKnowledge: (trackId: string, knowledgeId: string, userId: string) => void;
  seedCustomKnowledge: (trackId: string, seeds: { type: MemoryType; content: string; confidence: number }[], userId: string) => void;
  addMemoryEntry: (trackId: string, entry: { type: MemoryType; content: string; source: 'ai' | 'user' | 'system' }, userId: string) => void;
  updateMemoryEntry: (trackId: string, memoryId: string, updates: Partial<Pick<MemoryEntry, 'content' | 'type' | 'confidence'>>) => void;
  deleteMemoryEntry: (trackId: string, memoryId: string) => void;
  boostMemory: (trackId: string, memoryId: string, delta: number) => void;
  getTrackMemories: (trackId: string) => MemoryEntry[];
}

// Helper: fire-and-forget Supabase writes (don't block UI)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any;

export const useTrackStore = create<TrackStore>()(
  (set, get) => ({
    tracks: [],
    currentId: null,
    history: [],
    hydrated: false,

    hydrate: async (userId: string) => {
      const supabase = sb();

      // Fetch tracks
      const { data: dbTracks } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // Fetch history
      const { data: dbHistory } = await supabase
        .from('history_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks: Track[] = ((dbTracks || []) as any[]).map((t: any) => ({
        id: t.id,
        name: t.name,
        desc: t.description,
        color: t.color,
        banned: t.banned,
        fewShot: t.few_shot,
        memory: '',
        memories: [],
        knowledgeId: t.knowledge_id || undefined,
        knowledgeSeeded: t.knowledge_seeded,
        profile: (t.target_audience || t.persona || t.product || t.content_goal)
          ? { targetAudience: t.target_audience, persona: t.persona, product: t.product, contentGoal: t.content_goal }
          : undefined,
        profileCompleted: t.profile_completed,
        refAccounts: t.ref_accounts,
        count: t.count,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const history: HistoryItem[] = ((dbHistory || []) as any[]).map((h: any) => ({
        id: h.id,
        trackId: h.track_id,
        trackName: h.track_name,
        trackColor: h.track_color,
        prompt: h.prompt,
        result: h.result as HistoryItem['result'],
        createdAt: new Date(h.created_at).getTime(),
        usedMemoryIds: h.used_memory_ids,
        strategy: h.strategy as HistoryItem['strategy'],
      }));

      set({
        tracks,
        history,
        currentId: tracks[0]?.id ?? null,
        hydrated: true,
      });
    },

    addHistoryItem: (item) => {
      const id = 'h' + Date.now() + Math.random().toString(36).slice(2, 6);
      const createdAt = Date.now();

      set(s => ({
        history: [{ ...item, id, createdAt }, ...s.history].slice(0, MAX_HISTORY),
      }));

      // Async write to Supabase (get userId from auth)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sb().auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
        if (!user) return;
        sb().from('history_items').insert({
          id,
          track_id: item.trackId,
          user_id: user.id,
          track_name: item.trackName,
          track_color: item.trackColor,
          prompt: item.prompt,
          result: item.result as unknown as Record<string, unknown>,
          strategy: item.strategy || null,
          used_memory_ids: item.usedMemoryIds || [],
        }).then(() => {});
      });
    },

    deleteHistoryItem: (id) => {
      set(s => ({ history: s.history.filter(h => h.id !== id) }));
      sb().from('history_items').delete().eq('id', id).then(() => {});
    },

    clearTrackHistory: (trackId) => {
      set(s => ({ history: s.history.filter(h => h.trackId !== trackId) }));
      sb().from('history_items').delete().eq('track_id', trackId).then(() => {});
    },

    selectTrack: (id) => set({ currentId: id }),

    addTrack: async (data, userId) => {
      const id = genId();
      set(s => ({
        tracks: [...s.tracks, { ...data, id, memories: data.memories || [] }],
        currentId: id,
      }));

      await sb().from('tracks').insert({
        id,
        user_id: userId,
        name: data.name,
        description: data.desc,
        color: data.color,
        banned: data.banned,
        few_shot: data.fewShot,
        ref_accounts: data.refAccounts,
        knowledge_id: data.knowledgeId || null,
        knowledge_seeded: data.knowledgeSeeded || false,
        profile_completed: data.profileCompleted || false,
        target_audience: data.profile?.targetAudience || '',
        persona: data.profile?.persona || '',
        product: data.profile?.product || '',
        content_goal: data.profile?.contentGoal || '',
        count: data.count,
      });

      return id;
    },

    updateTrack: (id, data) => {
      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? { ...t, ...data } : t),
      }));

      // Build Supabase update payload (only changed fields)
      const dbUpdate: Record<string, unknown> = {};
      if (data.name !== undefined) dbUpdate.name = data.name;
      if (data.desc !== undefined) dbUpdate.description = data.desc;
      if (data.color !== undefined) dbUpdate.color = data.color;
      if (data.banned !== undefined) dbUpdate.banned = data.banned;
      if (data.fewShot !== undefined) dbUpdate.few_shot = data.fewShot;
      if (data.refAccounts !== undefined) dbUpdate.ref_accounts = data.refAccounts;
      if (data.knowledgeId !== undefined) dbUpdate.knowledge_id = data.knowledgeId;
      if (data.knowledgeSeeded !== undefined) dbUpdate.knowledge_seeded = data.knowledgeSeeded;
      if (data.profileCompleted !== undefined) dbUpdate.profile_completed = data.profileCompleted;
      if (data.count !== undefined) dbUpdate.count = data.count;
      if (data.profile) {
        dbUpdate.target_audience = data.profile.targetAudience;
        dbUpdate.persona = data.profile.persona;
        dbUpdate.product = data.profile.product;
        dbUpdate.content_goal = data.profile.contentGoal;
      }
      dbUpdate.updated_at = new Date().toISOString();

      if (Object.keys(dbUpdate).length > 1) {
        sb().from('tracks').update(dbUpdate).eq('id', id).then(() => {});
      }
    },

    deleteTrack: (id) => {
      set(s => {
        const remaining = s.tracks.filter(t => t.id !== id);
        return {
          tracks: remaining,
          currentId: s.currentId === id ? (remaining[0]?.id ?? null) : s.currentId,
        };
      });
      // Cascade delete handled by DB foreign keys
      sb().from('tracks').delete().eq('id', id).then(() => {});
    },

    getTrack: (id) => get().tracks.find(t => t.id === id),

    getCurrentTrack: () => {
      const { tracks, currentId } = get();
      return tracks.find(t => t.id === currentId);
    },

    incrementCount: (id) => {
      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? { ...t, count: t.count + 1 } : t),
      }));
      const track = get().tracks.find(t => t.id === id);
      if (track) {
        sb().from('tracks').update({ count: track.count, updated_at: new Date().toISOString() }).eq('id', id).then(() => {});
      }
    },

    seedKnowledge: (trackId, knowledgeId, userId) => {
      const builtin = getBuiltinTrack(knowledgeId);
      if (!builtin) return;
      const now = Date.now();
      const seedEntries: MemoryEntry[] = builtin.seeds.map((seed, i) => ({
        id: genMemoryId() + i, trackId, type: seed.type, content: seed.content,
        source: 'system' as const, confidence: seed.confidence, hitCount: 0, createdAt: now, updatedAt: now,
      }));

      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId || t.knowledgeSeeded) return t;
          return { ...t, knowledgeId, knowledgeSeeded: true, memories: [...(t.memories || []), ...seedEntries] };
        }),
      }));

      // Write to Supabase
      sb().from('tracks').update({ knowledge_id: knowledgeId, knowledge_seeded: true }).eq('id', trackId).then(() => {});

      // Fire-and-forget to mem0 (infer=false for seeds: store as-is, immediately queryable)
      const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
      if (mem0ApiKey) {
        for (const e of seedEntries) {
          addMemory(
            [{ role: 'user', content: e.content }],
            userId,
            trackId,
            mem0ApiKey,
            { type: e.type, source: e.source, confidence: e.confidence },
            { infer: false },
          ).catch(console.warn);
        }
      }
    },

    seedCustomKnowledge: (trackId, seeds, userId) => {
      const now = Date.now();
      const seedEntries: MemoryEntry[] = seeds.map((seed, i) => ({
        id: genMemoryId() + i, trackId, type: seed.type, content: seed.content,
        source: 'system' as const, confidence: seed.confidence, hitCount: 0, createdAt: now, updatedAt: now,
      }));

      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId || t.knowledgeSeeded) return t;
          return { ...t, knowledgeId: 'custom', knowledgeSeeded: true, memories: [...(t.memories || []), ...seedEntries] };
        }),
      }));

      sb().from('tracks').update({ knowledge_id: 'custom', knowledge_seeded: true }).eq('id', trackId).then(() => {});

      // Fire-and-forget to mem0 (infer=false for seeds: store as-is, immediately queryable)
      const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
      if (mem0ApiKey) {
        for (const e of seedEntries) {
          addMemory(
            [{ role: 'user', content: e.content }],
            userId,
            trackId,
            mem0ApiKey,
            { type: e.type, source: e.source, confidence: e.confidence },
            { infer: false },
          ).catch(console.warn);
        }
      }
    },

    addMemoryEntry: (trackId, { type, content, source }, userId) => {
      const now = Date.now();
      const entryId = genMemoryId();
      const entry: MemoryEntry = {
        id: entryId, trackId, type, content, source,
        confidence: source === 'user' ? 0.9 : 0.4, hitCount: 0, createdAt: now, updatedAt: now,
      };

      set(s => ({
        tracks: s.tracks.map(t => t.id === trackId ? { ...t, memories: [...(t.memories || []), entry] } : t),
      }));

      // Fire-and-forget to mem0 (infer=false for user/system; raw store immediately queryable)
      const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
      if (mem0ApiKey) {
        addMemory(
          [{ role: 'user', content }],
          userId,
          trackId,
          mem0ApiKey,
          { type, source, confidence: entry.confidence },
          { infer: false },
        ).catch(console.warn);
      }
    },

    updateMemoryEntry: (trackId, memoryId, updates) => {
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId) return t;
          return { ...t, memories: (t.memories || []).map(m => m.id === memoryId ? { ...m, ...updates, updatedAt: Date.now() } : m) };
        }),
      }));

      // Fire-and-forget to mem0
      const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
      if (mem0ApiKey) {
        updateMemory(memoryId, { text: updates.content, metadata: { type: updates.type } }, mem0ApiKey).catch(console.warn);
      }
    },

    deleteMemoryEntry: (trackId, memoryId) => {
      set(s => ({
        tracks: s.tracks.map(t => t.id === trackId ? { ...t, memories: (t.memories || []).filter(m => m.id !== memoryId) } : t),
      }));

      // Fire-and-forget to mem0
      const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
      if (mem0ApiKey) {
        deleteMemory(memoryId, mem0ApiKey).catch(console.warn);
      }
    },

    boostMemory: (trackId, memoryId, delta) => {
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId) return t;
          const updated = (t.memories || [])
            .map(m => m.id === memoryId
              ? { ...m, confidence: Math.max(0, Math.min(1.0, m.confidence + delta)), updatedAt: Date.now() }
              : m
            )
            .filter(m => m.confidence >= 0.05);
          // Fire-and-forget to mem0
          const mem = updated.find(m => m.id === memoryId);
          const mem0ApiKey = useSettingsStore.getState().mem0ApiKey;
          if (mem) {
            if (mem0ApiKey) {
              updateMemory(memoryId, { metadata: { confidence: mem.confidence } }, mem0ApiKey).catch(console.warn);
            }
          } else {
            // Filtered out (confidence < 0.05), delete
            if (mem0ApiKey) {
              deleteMemory(memoryId, mem0ApiKey).catch(console.warn);
            }
          }
          return { ...t, memories: updated };
        }),
      }));
    },

    getTrackMemories: (trackId) => {
      const track = get().tracks.find(t => t.id === trackId);
      return track?.memories || [];
    },
  })
);
