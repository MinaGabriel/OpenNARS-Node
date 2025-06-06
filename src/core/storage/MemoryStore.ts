// src/core/MemoryStore.ts
import { createStore } from 'zustand/vanilla';
import { Time } from '../Time';
import { Memory } from './Memory';
import { Reasoner } from '../Reasoner';
import { GeneralEngine } from '../GeneralEngin';
import { NarseseChannel } from '../io/NarseseChannel';
// This file defines the MemoryStore, which is a Zustand store for managing the memory, time, reasoner, engine, and channel in the NARS system.


let currentStampSerial = -1; // Serial number for the current stamp, initialized to -1
export interface MemoryStore {
  time: Time;
  memory: Memory;
  reasoner: Reasoner;
  engine: GeneralEngine;
  channel: NarseseChannel;
  getNextStampSerial: () => number; // Serial number for the current stamp
  resetAll: () => void;
}

export const MemoryStore = createStore<MemoryStore>((set) => ({
  time: new Time(),
  memory: new Memory(),
  engine: new GeneralEngine(),
  channel: new NarseseChannel(),
  reasoner: undefined as unknown as Reasoner, // placeholder, set after
  getNextStampSerial: () => {
    currentStampSerial += 1;
    return currentStampSerial;
  },

  resetAll: () =>
    set({
      time: new Time(),
      memory: new Memory(),
      engine: new GeneralEngine(),
      channel: new NarseseChannel(),
      reasoner: undefined as unknown as Reasoner,
    }),
}));
