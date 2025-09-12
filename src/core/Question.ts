 
import { Truth } from './Truth';
import { Punctuation } from './enums/Enums';
import { Term } from './Term';
import { Sentence } from './Sentence';
import { BaseEntry, Stamp } from './Stamp';
import { MemoryStore } from './storage/MemoryStore';
import * as Enum from './enums/Enums';
import { Concept } from './Concept';
import { Parameters } from './Parameters';
import { nanoid } from 'nanoid';
import { MathFunctions } from './utils/MathFunctions';

class Question extends Sentence {
    constructor(term: Term, tense?: Enum.Tense | null) {
     
            /* if -1, will be set right before the Task is input NarseseChannel */
            const base = new BaseEntry(Number(MathFunctions.randomSigned64Bit()), MemoryStore.getState().getNextStampSerial());
            const finalStamp = new Stamp(-1, tense !== undefined ? tense : null, base, Parameters.DURATION);
            super(term, Punctuation.QUESTION, null, finalStamp);
        }
    
}

export { Question };
