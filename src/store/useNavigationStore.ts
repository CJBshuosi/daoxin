'use client';

import { create } from 'zustand';

export type PageId = 'workspace' | 'knowledge' | 'tracks' | 'documents' | 'settings';

interface NavigationPayload {
  topic?: string;
  trackId?: string;
}

interface NavigationStore {
  activePage: PageId;
  payload: NavigationPayload | null;
  navigate: (page: PageId, payload?: NavigationPayload) => void;
  consumePayload: () => NavigationPayload | null;
}

export const useNavigationStore = create<NavigationStore>()((set, get) => ({
  activePage: 'workspace',
  payload: null,
  navigate: (page, payload) => set({ activePage: page, payload: payload ?? null }),
  consumePayload: () => {
    const p = get().payload;
    set({ payload: null });
    return p;
  },
}));
