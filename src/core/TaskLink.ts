import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Link } from "./Link";
import { Task } from "./Task";
import { TermLink } from "./TermLink";


class TaskLink extends Link{
    constructor(source: Concept, target: Task, budget: Budget){
        super(source, target, budget); 
    }
}


export{TaskLink}