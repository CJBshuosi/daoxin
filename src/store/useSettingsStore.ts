'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'claude' | 'gemini' | 'gpt4';

interface SettingsStore {
  model: ModelId;
  setModel: (model: ModelId) => void;
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;
  baseUrls: Record<string, string>;
  setBaseUrl: (provider: string, url: string) => void;
  mem0ApiKey: string;
  setMem0ApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      model: 'claude',
      setModel: (model) => set({ model }),
      apiKeys: {},
      setApiKey: (provider, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
      baseUrls: {},
      setBaseUrl: (provider, url) =>
        set((s) => ({ baseUrls: { ...s.baseUrls, [provider]: url } })),
      mem0ApiKey: '',
      setMem0ApiKey: (key) => set({ mem0ApiKey: key }),
    }),
    { name: 'daoxin_settings' }
  )
);
