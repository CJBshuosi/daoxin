'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'claude' | 'qwen' | 'gemini' | 'gpt4';

interface SettingsStore {
  model: ModelId;
  setModel: (model: ModelId) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      model: 'claude',
      setModel: (model) => set({ model }),
    }),
    { name: 'daoxin_settings' }
  )
);
