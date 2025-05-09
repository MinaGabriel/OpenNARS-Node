import { Truth } from './Truth';
import { Punctuation } from './Punctuation';
import { Term } from './Term';
import { Sentence } from './Sentence';
import { Stamp } from './Stamp';
import { Tense } from './Tense';

class Judgement extends Sentence {
    constructor(content: Term, punctuation: Punctuation, truth: Truth, tense: Tense) { 

        //TODO: Implement stamp now is is just empty object 
        super(content, punctuation, truth, new Stamp(), tense); 
    }
 
}

export { Judgement };