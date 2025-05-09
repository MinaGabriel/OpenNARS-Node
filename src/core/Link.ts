import { Budget } from "./Budget"
import { Concept } from "./Concept"
import { Item } from "./Item"
import { Task } from "./Task"
import { Term } from "./Term"

/**
 * A Term can be:
 * - A simple atomic symbol (like A or B) → atomic term
 * - A CompoundTerm → something like (&, A, B) or (/, A, B) meaning a structured combination
 * 
 * A TermLink connects terms:
 * - For example, from the compound (&, A, B) to its components A and B
 * 
 * A TaskLink connects tasks:
 * - It connects a task to the concept it's working on
 */


class Link extends Item {
    private type?: LinkType
    private source: Concept
    private target: Task
    private source_is_component: boolean
    private copy_budget: boolean
    private index: number[]
    constructor(source: Concept, target: Task, budget: Budget,
        source_is_component: boolean = false,
        copy_budget: boolean = true, index: number[] = []) {
        super()
        this.source = source
        this.target = target
        this.budget = budget // in Item
        this.source_is_component = source_is_component
        this.copy_budget = copy_budget
        this.index = index
        this.type = undefined
    }


    private setType(source_is_component?: boolean, type?: LinkType, enable_transform: boolean = false): void {
        const term_source: Term = this.source.getTerm();
        const term_target: Term = this.target.sentence.getContent(); //Term 
        //FIXME: if source_is_component is None: add this

        if (source_is_component) {
            if(term_target.identical(term_source)){
                this.type = LinkType.SELF
            }else if (term_target.isStatement) {

                
            }




        }
    }
}

export { Link }