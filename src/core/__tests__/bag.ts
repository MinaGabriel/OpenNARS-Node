import { Bag } from "../Bag";
import { Budget } from "../Budget";
import { Item } from "../Item";

class G extends Item {
    constructor(key: string, budget: Budget) {
        super(key, budget);
    }
}

class M extends Bag<G> {
    constructor() {
        super()
    }
}

// Create instance of M
let bag = new M(); 

// Add items to the bag
bag.putIn(new G("<a --> b>.", new Budget(undefined, 1.0, 0.5, 0.5)));
bag.putIn(new G("<b --> c>.", new Budget(undefined, 0.5, 0.5, 0.5)));

// Pick out an item and store result
let result: G | null = bag.pickOut("<a --> b>.");

console.log(`${result}`);