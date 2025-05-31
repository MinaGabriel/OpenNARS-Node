import { Truth } from './Truth';
import { Punctuation } from './Enums';
import { Term } from './Term';
import { Sentence } from './Sentence';
import { BaseEntry, Stamp } from './Stamp';
import { MemoryStore } from './MemoryStore';
import * as Enum from './Enums';
import { Concept } from './Concept';
import { Parameters } from './Parameters';
import { nanoid } from 'nanoid';
import { System } from './Functions';
export class Judgement extends Sentence {
    constructor(term: Term, punctuation: Punctuation, truth: Truth, tense: Enum.Tense) {

        if (truth === null) {
            truth = new Truth(1.0, Parameters.DEFAULT_JUDGMENT_CONFIDENCE)
        }
        /* if -1, will be set right before the Task is input NarseseChannel */
        super(term, punctuation, truth, new Stamp(-1, tense,
            new BaseEntry(Number(System.Math.randomSigned64Bit()),
                MemoryStore.getState().getNextStampSerial()),
            Parameters.DURATION));
    }

}

