// Node.js built-ins
import pegjs from 'pegjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


// Local imports
import { Task } from './Task';
import { Config } from './Config';
import { Sentence } from './Sentence';
import { Judgement } from './Judgement';
import { Term } from './Term';
import { Copula } from './Copula';
import { Statement } from './Statement';
import { Budget } from './Budget';
import { Truth } from './Truth';
import { Question } from './Question';
import { Quest } from './Quest';
import { Goal } from './Goal';
import { Tense } from './Tense';
import { Punctuation } from './Punctuation';
import { Stamp } from './Stamp';
/**
 * Parser class for Narsese language
 * Handles parsing of Narsese statements and converts them to Tasks
 * 
 * Examples:
 * - Simple statement: <bird --> animal>
 * - Compound statement: <<$1 --> b> --> <$2 --> c>>
 * - Statement with truth: <bird --> animal>. %0.9;0.8%
 */
class NarseseParser {
    private parser: pegjs.Parser;

    /**
     * Initialize the parser with grammar and configuration
     */
    constructor() {
        const grammarPath = join(__dirname, './narsese_grammar.pegjs');
        const grammar = readFileSync(grammarPath, 'utf8');
        this.parser = pegjs.generate(grammar);
    }

     

    /**
     * Parse Narsese input into a Task
     * @param input - Narsese statement to parse
     * @returns Parsed task object
     * @throws If parsing fails
     */
    parse(input: string): Task {
        

        try {
            const task = this.parser.parse(input, {
                Term,
                Copula,
                Sentence,
                Statement,
                Budget,
                Judgement,
                Truth,
                Tense,
                Config,
                Punctuation,
                Task,
                Stamp
            });
            // TODO: Implement the Buffer
            return task;
        } catch (error: any) {
            console.error('Parse error:', error.message);
            throw new Error(`Failed to parse input: ${error.message}`);
        }
    }
}

export { NarseseParser };