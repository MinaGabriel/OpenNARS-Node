// Local imports
import { Task } from './Task';
import { Parameters } from './Parameters';
import { Judgement } from './Judgement';
import { Term } from './Term';
import { Copula } from './Copula';
import { Statement } from './Statement';
import { Truth } from './Truth';
import { Tense } from './Tense';
import { Punctuation } from './Punctuation';
import { Budget } from './Budget';
import { BudgetFunctions } from './BudgetFunctions';
import { TermType } from './TermType'; 
import { Connector } from './Connector';
import { ConnectorType } from './ConnectorType';
import { Compound } from './Compound';
import logger from '../utils/Logger';

// Import the precompiled parser
// @ts-ignore
import narseseParser from './narsese_grammar.js'; //TODO:: USE --> npm run build:grammar

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
    private parser: typeof narseseParser;

    /**
     * Initialize the parser with grammar and configuration
     */
    constructor() {
        this.parser = narseseParser;
    }

    /**
     * Parse Narsese input into a Task
     * @param input - Narsese statement to parse
     * @returns Parsed task object
     * @throws If parsing fails
     */
    parse(input: string): Task | null {
        try {
            const task = this.parser.parse(input, {
                Term,
                Copula,
                Statement,
                Parameters,
                Budget,
                BudgetFunctions,
                Judgement,
                TermType,
                Truth,
                Tense,
                Punctuation,
                Task,
                Connector,
                ConnectorType,
                Compound,
                logger
            });
            return task;
        } catch (error: any) {
            throw new Error('Parse error: ' + error.message);
        }
    }
}

export { NarseseParser };

