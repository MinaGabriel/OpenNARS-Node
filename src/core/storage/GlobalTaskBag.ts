import { Bag } from "./Bag";
import { Parameters } from "../Parameters";
import { Task } from "../Task";

export class GlobalTaskBag extends Bag<Task> {
    // ConceptBag specific implementations

    constructor() {
        super(Parameters.GLOBAL_BUFFER_SIZE); 
    }
 
}