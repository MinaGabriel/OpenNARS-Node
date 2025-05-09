import { TaskBag } from "../TermLink";
import { Task } from "../Task";
import { Term } from "../Term";
import { Copula } from "../Copula";
import { Statement } from "../Statement";
import { Judgement } from "../Judgement";
import { Budget } from "../Budget";
import { Memory } from "../Memory";

describe('TaskBag', () => {
    let taskBag: TaskBag;
    let task1: Task;

    beforeEach(() => {
        taskBag = new TaskBag();
        task1 = new Task(
            new Judgement(
                new Statement(
                    new Term({ word: 'a' }),
                    Copula.Implication,
                    new Term({ word: 'b' })
                )
            ),
            new BudgetValue(new Memory()),
            new Memory()
        );
    });

    test('should initialize empty', () => {
        expect(taskBag.getAllContents()).toEqual([]);
    });

    test('should put and get item', () => {
        taskBag.putIn(task1);
        expect(taskBag.get(task1.getKey())).toBe(task1);
    });

    test('should contain item', () => {
        taskBag.putIn(task1);
        expect(taskBag.contains(task1)).toBe(true);
    });

    test('should pick out and remove item', () => {
        taskBag.putIn(task1);
        const picked = taskBag.pick_out(task1.getKey());
        expect(picked).toBe(task1);
        expect(taskBag.get(task1.getKey())).toBeUndefined();
    });
});
