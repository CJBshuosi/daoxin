'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'claude' | 'gemini' | 'gpt4';

interface SettingsStore {
  model: ModelId;
  setModel: (model: ModelId) => void;
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      model: 'claude',
      setModel: (model) => set({ model }),
      apiKeys: {},
      setApiKey: (provider, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
    }),
    { name: 'daoxin_settings' }
  )
);
