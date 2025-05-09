import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { TermLink } from "./TermLink";


class TaskLink extends TermLink {
    constructor(source: Concept, target: Concept, budget: Budget, copy_budget: boolean = true){
        
    }
}

export{TaskLink}