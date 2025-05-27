// src/core/MemoryStore.ts
import { createStore } from 'zustand/vanilla';
import { Time } from './Time';
import { Memory } from './Memory';
import { Reasoner } from './Reasoner';
import { GeneralEngine } from './GeneralEngin';
import { NarseseChannel } from './NarseseChannel';

export interface MemoryStore {
  time: Time;
  memory: Memory;
  reasoner: Reasoner;
  engine: GeneralEngine;
  channel: NarseseChannel;
  resetAll: () => void;
}

export const MemoryStore = createStore<MemoryStore>((set) => ({
  time: new Time(),
  memory: new Memory(),
  engine: new GeneralEngine(),
  channel: new NarseseChannel(),
  reasoner: undefined as unknown as Reasoner, // placeholder, set after
  resetAll: () =>
    set({
      time: new Time(),
      memory: new Memory(),
      engine: new GeneralEngine(),
      channel: new NarseseChannel(),
      reasoner: undefined as unknown as Reasoner,
    }),
}));
