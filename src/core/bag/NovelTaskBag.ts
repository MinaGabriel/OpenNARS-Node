import { Bag } from "./Bag";
import { Task } from "../Task";


class NovelTaskBag extends Bag<Task> {
    constructor() {
        super();
    }
}

export { NovelTaskBag };