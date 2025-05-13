/* 
 * The MIT License
 *
 * Copyright 2019 The OpenNARS authors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Collected system parameters. To be modified before compiling.
 */
export class Parameters {
    /* ---------- initial values of run-time adjustable parameters ---------- */
    /** Concept decay rate in ConceptBag, in [1, 99]. */
    public static readonly CONCEPT_FORGETTING_CYCLE: number = 10;
    /** TaskLink decay rate in TaskLinkBag, in [1, 99]. */
    public static readonly TASK_LINK_FORGETTING_CYCLE: number = 20;
    /** TermLink decay rate in TermLinkBag, in [1, 99]. */
    public static readonly TERM_LINK_FORGETTING_CYCLE: number = 50;
    /** Silent threshold for task reporting, in [0, 100]. */
    public static readonly SILENT_LEVEL: number = 0;

    /* ---------- time management ---------- */
    /** Task decay rate in TaskBuffer, in [1, 99]. */
    public static readonly NEW_TASK_FORGETTING_CYCLE: number = 1;
    /** Maximum TermLinks checked for novelty for each TaskLink in TermLinkBag */
    public static readonly MAX_MATCHED_TERM_LINK: number = 10;
    /** Maximum TermLinks used in reasoning for each Task in Concept */
    public static readonly MAX_REASONED_TERM_LINK: number = 3;

    /* ---------- logical parameters ---------- */
    /** Evidential Horizon, the amount of future evidence to be considered. */
    public static readonly HORIZON: number = 1;
    /** Reliance factor, the empirical confidence of analytical truth. */
    public static readonly RELIANCE: number = 0.9;

    /* ---------- budget thresholds ---------- */
    /** The budget threshold rate for task to be accepted. */
    public static readonly BUDGET_THRESHOLD: number = 0.01;

    /* ---------- default input values ---------- */
    /** Default expectation for confirmation. */
    public static readonly DEFAULT_CONFIRMATION_EXPECTATION: number = 0.8;
    /** Default expectation for creation. */
    public static readonly DEFAULT_CREATION_EXPECTATION: number = 0.66;
    /** Default confidence of input judgment. */
    public static readonly DEFAULT_JUDGMENT_CONFIDENCE: number = 0.9;
    /** Default priority of input judgment */
    public static readonly DEFAULT_JUDGMENT_PRIORITY: number = 0.8;
    /** Default durability of input judgment */
    public static readonly DEFAULT_JUDGMENT_DURABILITY: number = 0.8;
    /** Default priority of input question */
    public static readonly DEFAULT_QUESTION_PRIORITY: number = 0.9;
    /** Default durability of input question */
    public static readonly DEFAULT_QUESTION_DURABILITY: number = 0.9;

    /* ---------- space management ---------- */
    /** Level granularity in Bag, two digits */
    public static readonly BAG_LEVEL: number = 100;
    /** Level separation in Bag, one digit */
    public static readonly BAG_THRESHOLD: number = 10;
    /** Hashtable load factor in Bag */
    public static readonly LOAD_FACTOR: number = 0.5;
    /** Size of ConceptBag */
    public static readonly CONCEPT_BAG_SIZE: number = 1000;
    /** Size of TaskLinkBag */
    public static readonly TASK_LINK_BAG_SIZE: number = 20;
    /** Size of TermLinkBag */
    public static readonly TERM_LINK_BAG_SIZE: number = 100;
    /** Size of TaskBuffer */
    public static readonly TASK_BUFFER_SIZE: number = 10;

    /* ---------- avoiding repeated reasoning ---------- */
    /** Maximum length of Stamp, a power of 2 */
    public static readonly MAXIMUM_STAMP_LENGTH: number = 8;
    /** Remember recently used TermLink on a Task */
    public static readonly TERM_LINK_RECORD_LENGTH: number = 10;
    /** Maximum number of beliefs kept in a Concept */
    public static readonly MAXIMUM_BELIEF_LENGTH: number = 7;
    /** Maximum number of questions kept in a Concept */
    public static readonly MAXIMUM_QUESTIONS_LENGTH: number = 5;
    static CONCEPT_BAG_CAPACITY: number;
}