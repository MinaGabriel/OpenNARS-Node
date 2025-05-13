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
        super(10)
    }
}

// Create instance of M
let bag = new M(); 

// Add items to the bag
bag.putIn(new G("<a --> b>.", new Budget(undefined, 1.0, 0.5, 0.5)));
bag.putIn(new G("<b --> x>.", new Budget(undefined, 0.8, 0.5, 0.5)));
bag.putIn(new G("<a --> d>.", new Budget(undefined, 1.0, 0.5, 0.5)));
bag.putIn(new G("<b --> w>.", new Budget(undefined, 0.4, 0.5, 0.5)));
bag.putIn(new G("<a --> e>.", new Budget(undefined, 1.0, 0.5, 0.5)));
bag.putIn(new G("<b --> r>.", new Budget(undefined, 0.3, 0.5, 0.5)));

// Pick out an item and store result
let result: G | null = bag.pickOut("<a --> b>.");
let takeout = bag.takeOut();
let takeout2 = bag.takeOut();
let takeout3 = bag.takeOut();
let takeout4 = bag.takeOut();
console.log(`${result}`);