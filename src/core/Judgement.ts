import { Truth } from './Truth';
import { Punctuation } from './Punctuation';
import { Term } from './Term';
import { Sentence } from './Sentence';
import { Stamp } from './Stamp';
import { Tense } from './Tense';
import { MemoryStore } from './MemoryStore';
class Judgement extends Sentence {
    constructor(term: Term, punctuation: Punctuation, truth: Truth, tense: Tense) {
        super(term, punctuation, truth, new Stamp(MemoryStore.getState().time.narsClock()), tense);
    }
}

export { Judgement };