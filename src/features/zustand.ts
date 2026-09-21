import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const COUNTER_STORE = `import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => {
    set((state) => ({ count: state.count + 1 }));
  },
  reset: () => {
    set({ count: 0 });
  },
}));
`;

export const zustand: Feature = {
  id: 'zustand',
  enabled: (selection) => selection.zustand,
  dependencies: () => entries(['zustand']),
  files: () => [{ path: 'src/stores/counter-store.ts', contents: COUNTER_STORE }],
};
