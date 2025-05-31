// src/core/Reasoner.ts
import { MemoryStore } from './MemoryStore';
import { Task } from './Task';
import { Stamp } from './Stamp';

export class Reasoner {
  private _memory = MemoryStore.getState().memory;
  private _time = MemoryStore.getState().time;
  private _engine = MemoryStore.getState().engine;
  private _channel = MemoryStore.getState().channel;

  constructor() { 
    MemoryStore.setState({ reasoner: this });
  }

  inputNarsese(text: string): [boolean, Task | null, Task | null] {
    if (!isNaN(Number(text.trim())) && text.trim() !== '') {
      const cycles = parseInt(text.trim());
      for (let i = 0; i < cycles; i++) {
        this._memory.workCycle();
        this._time.tick();
      }
      return [true, null, null];
    } else {
      const [success, task, overflow] = this._channel.put(text);
      if (task) {
        this._memory.input(task);
        this._memory.workCycle();
        this._time.tick();
      }
      return [success, task, overflow];
    }
  }
}
