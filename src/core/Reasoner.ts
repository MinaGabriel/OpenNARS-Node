import { GeneralEngine } from './GeneralEngin';
import { Memory } from './Memory';
import { NarseseChannel } from './NarseseChannel';

/**
 * Reasoner class for OpenNARS
 * Handles reasoning and inference using the General Engine
 */
class Reasoner {
    private inference: GeneralEngine;
    private narsese_channel: NarseseChannel;
    private memory: Memory;

    /**
     * Create a new Reasoner instance
     * @param config - Path to the configuration file (default: './config.json')
     * @param nal_rules - Array of NAL rules (default: [1, 2, 3, 4, 5, 6, 7, 8, 9])
     */
    constructor() {
        this.inference = new GeneralEngine();
        this.narsese_channel = new NarseseChannel(); // Initialize Narsese channel
        this.memory = new Memory(); 
    }

    /**
     * Processes input Narsese text and optionally runs a reasoning cycle
     * @param text - The Narsese input text to process
     * @param goCycle - Whether to run a reasoning cycle after input (default: false)
     * @returns An array containing [success, task, taskOverflow]
     */
    inputNarsese(text: string, goCycle: boolean = false): [boolean, any, any] {
        const [success, task, taskOverflow] = this.narsese_channel.put(text);

        //FIXME
        // if (goCycle) {
        //     this.inference.cycle(); // Run a reasoning cycle if requested
        // }

        return [success, task, taskOverflow];
    }
}

export { Reasoner };