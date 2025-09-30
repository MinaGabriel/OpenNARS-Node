import { MemoryStore } from './Memory';
import { NarseseParser } from './NarseseParser';
import { Task } from './nalCorePrimitives';
import { LogFunctions } from './LogFunctions';

/**
 * NarseseChannel class for handling Narsese input
 */
class NarseseChannel {
    private parser: NarseseParser;

    constructor() {
        this.parser = new NarseseParser();
    }

    /**
     * Processes Narsese text input and returns the parsing results
     * @param text - The Narsese text to parse
     * @returns An array containing [success: boolean, task: Task | null, overflow: null]
     * @throws {Error} If text is empty or invalid
     */
    put(text: string): [boolean, Task | null, null] {
        if (!text.trim()) {
            throw new Error('Input text cannot be empty');
        }

        try {
            // Parse the input text
            const task = this.parser.parse(text);
            //If Sentence is not eternal set occurrence time. 
            if (task && !task.sentence.isEternal()) {
                task.sentence.stamp.occurrenceTime = MemoryStore.getState().time.narsClock();
            }
            if (task) {
                task.sentence.stamp.creationTime = MemoryStore.getState().time.narsClock();
            }

            return [true, task, null];
        } catch (error) {
            LogFunctions.both.error(`Error parsing Narsese input: ${text} ` );
            return [false, null, null];
        }
    }
}

export { NarseseChannel };