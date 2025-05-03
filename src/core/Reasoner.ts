import { GeneralEngine } from './GeneralEngin';
import { NarseseChannel } from './NarseseChannel';

/**
 * Reasoner class for OpenNARS
 * Handles reasoning and inference using the General Engine
 */
class Reasoner {
    private config: string;
    private nal_rules: number[];
    private inference: GeneralEngine;
    private narsese_channel: NarseseChannel;

    /**
     * Create a new Reasoner instance
     * @param config - Path to the configuration file (default: './config.json')
     * @param nal_rules - Array of NAL rules (default: [1, 2, 3, 4, 5, 6, 7, 8, 9])
     */
    constructor(config: string = './config.json', nal_rules: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        this.config = config;
        this.nal_rules = nal_rules;
        this.inference = new GeneralEngine();
        this.narsese_channel = new NarseseChannel(); // Initialize Narsese channel
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