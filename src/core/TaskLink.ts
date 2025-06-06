import { nanoid } from "nanoid";
import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Link } from "./Link";
import { Task } from "./Task";
import { TermLink } from "./TermLink";
import { LinkType } from "./enums/Enums";
import colors from "ansi-colors";
import { MemoryStore } from './storage/MemoryStore'; // adjust the path as needed

import _, { last, now } from "lodash";
import { Term } from "./Term";
import { Parameters } from "./Parameters";

class TaskLink extends Link {
    private lastSeenMap: Map<string, number> = new Map<string, number>();

    //source: A and target: is the task <A --> (/, A, L)> .
    constructor(source: Concept, target: Task, budget: Budget) {
        super(source, target, budget, true, true);
        console.log(`Task Link: ${colors.green(this.target.toString())} ${colors.yellow(_.isArray(this.index) && this.index.length > 0 ? JSON.stringify(this.index) : "")} ${LinkType[this.type as number] ?? ""}`);
    }
    toString(): string {
        return `Task Link: ${colors.green(this.target.toString())} ${colors.yellow(_.isArray(this.index) && this.index.length > 0 ? JSON.stringify(this.index) : "")} ${LinkType[this.type as number] ?? ""}`;
    }
    get task(): Task {
        return this.target as Task;
    }

    //If this term was used recently, it is not novel. 
    //Cycle	    Input Task	    Link Seen Before?	    Novel?	            Action
    // 1	    <B --> C>.	    No	                    ✅ Yes	            Deduce <A --> C>, store
    // 2	    <B --> C>.	    Yes (too soon)	        ❌ No	            Skip — already processed
    // 10	    <B --> C>.	    Yes,but old now	        ✅ Yes	            Allow again, re-derive maybe


    public isNovel(termLink: TermLink): boolean {
        
        //TODO:: Need to have a set size of the map to remove the oldest seen term links

        const termLinkTargetTerm = termLink.target.term;
        const taskLinkTargetTerm = this.target.term;
        const key = termLink.key;
        const currentNarsClock = MemoryStore.getState().time.narsClock();

        const horizon = Parameters.TERM_LINK_RECORD_LENGTH;

        // Skip if the TermLink is the same as the TaskLink
        // Example: Task Link: <Task <<A-->B>==><B-->C>> .> [0,0] COMPONENT_STATEMENT
        // Example: Term Link: <Concept <<A-->B>==><B-->C>>> COMPONENT_STATEMENT 

        if (termLinkTargetTerm.equals(taskLinkTargetTerm)) return false;

        const lastSeenTime = this.lastSeenMap.get(key);

        if (lastSeenTime !== undefined && currentNarsClock < lastSeenTime + horizon) return false; // Too recent, not novel (need to wait) 

        this.lastSeenMap.set(key, currentNarsClock);
        return true; // Novel, record it
    }



}


export { TaskLink }