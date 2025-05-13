import logger from '../utils/Logger';
import { GeneralEngine } from './GeneralEngin';
import { Memory } from './Memory';
import { NarseseChannel } from './NarseseChannel';
import { Stamp } from './Stamp';
import { Task } from './Task';

export class Reasoner {
    private inference: GeneralEngine;
    private narsese_channel: NarseseChannel;
    private _memory: Memory;
    private _clock: number = 0;


    constructor() {
        this.inference = new GeneralEngine();
        this.narsese_channel = new NarseseChannel();
        this._memory = new Memory();
        Stamp.init();
    }


    public get memory(): Memory {
        return this._memory;
    }

    public get clock(): number {
        return this._clock;
    }
    inputNarsese(text: string, goCycle: boolean = false): [boolean, Task | null, Task | null] {

        // Check if the input can be converted to a valid number
        if (!isNaN(Number(text.trim())) && text.trim() !== '') {
            logger.console.info(`Input is a number: ${text.trim()}, walking the cycle.`);
            // Convert cycles to number and run them
            const cycles = parseInt(text.trim());
            for (let i = 0; i < cycles; i++) {
                this.memory.workCycle(this._clock);
            }
            return [true, null, null];
        } else {
            const [success, task, taskOverflow] = this.narsese_channel.put(text);
            if (task) {
                this.memory.input(task);
                this.memory.workCycle(this._clock);
            }
            return [success, task, taskOverflow];
        }



    }

    tick(): void {
        this._clock++;
    }
}
