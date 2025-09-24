// ───── Imports ─────
import { Task } from './nalCorePrimitives';
import { Parameters } from "./Symbols";
import { Judgement } from './nalCorePrimitives';
import { Term } from './nalCorePrimitives';
import { Copula } from './nalCorePrimitives';
import { Statement } from './nalCorePrimitives';
import { Truth } from './nalCorePrimitives';
import { Tense, Punctuation, TermType, ConnectorType } from "./Symbols";
import { Budget } from './nalCorePrimitives'; 
import { BudgetFunctions } from "./RuleFunctions";
import { Connector } from './nalCorePrimitives';
import { Compound } from './nalCorePrimitives';  
import { TruthFunctions } from "./RuleFunctions";
import { Question } from './nalCorePrimitives';
// Import the precompiled parser
// @ts-ignore
import narseseParser from './narsese_grammar.js'; //  Use --> npm run build:grammar

/**
 * Parser class for Narsese language.
 * Handles parsing of Narsese statements and converts them to Tasks.
 * 
 * Examples:
 * - Simple statement: <bird --> animal>
 * - Compound statement: <<$1 --> b> --> <$2 --> c>>
 * - Statement with truth: <bird --> animal>. %0.9;0.8%
 */
class NarseseParser {
    private parser: typeof narseseParser;

    /**
     * Initialize the parser with grammar and configuration.
     */
    constructor() {
        this.parser = narseseParser;
    }

    /**
     * Parse Narsese input into a Task.
     * @param input - Narsese statement to parse
     * @returns Parsed Task object or null
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
                Judgement,
                TermType,
                Truth,
                Tense,
                Punctuation,
                Task,
                BudgetFunctions,
                Connector, 
                ConnectorType,
                Compound,
                TruthFunctions,
                Question
            });

            //ParseTruth if null 
            return task;
        } catch (error: any) {
            throw new Error('Parse error: ' + error.message);
        }
    }
}

export { NarseseParser };

