import cloneDeep from "clone-deep";
import { Connector } from "../Connector";
import { Copula } from "../Copula";
import { BaseEntry, Stamp } from "../Stamp";
import { Parameters } from "../Parameters";
import { MemoryStore } from "../storage/MemoryStore";
import { CopulaSymbols } from "../enums/Enums";
import _ from "lodash";

/**
 * Utility functions for stamp manipulation in Non-Axiomatic Reasoning System (NARS).
 * Implements stamp operations from Non-Axiomatic Logic (NAL).
 */
export class StampFunctions {
    /**
     * Merges two stamps, interleaving evidential bases and updating occurrence time.
     * Implements stamp merging from Non-Axiomatic Logic (NAL).
     * 
     * Reference:
     *   - Section 7.3: Temporal Inference, p. 192
     *   - Section 4.1: Belief Revision, pp. 45–50
     *   - PyNARS Stamp_merge (pynars.NAL.Functions.StampFunctions)
     * 
     * Example:
     *   - stamp1: { tOccurrence: 100, evidentialBase: [(1,1), (2,2)], isEternal: false, creationTime: 50 }
     *   - stamp2: { tOccurrence: 150, evidentialBase: [(3,3), (4,4)], isEternal: false, creationTime: 60 }
     *   - orderMark: Connector.SequentialEvents, reverseOrder: false, tBias: 0
     *   - Result: { tOccurrence: 150 + Config.temporalDuration, evidentialBase: [(1,1), (3,3), (2,2), (4,4)].slice(0, maxLength), creationTime: currentTime, isEternal: false }
     * 
     * @param stampOne - First stamp to merge (new belief)
     * @param stampTwo - Second stamp to merge (old belief)
     * @param orderMark - Temporal connector or copula (optional)
     * @param reverseOrder - If true, reverses the temporal interval
     * @param tBias - Time bias to adjust occurrence time
     * @returns Merged stamp
     */
    static revision(stampOne: Stamp | null, stampTwo: Stamp | null, orderMark: string | null = null, reverseOrder: boolean = false, tBias: number = 0): Stamp | null {
        if (!stampOne || !stampTwo) return null;
        const stamp: Stamp = cloneDeep(stampOne);
        // Interleave evidential bases
        const newBase = stampOne.evidentialBase;
        const oldBase = stampTwo.evidentialBase;
        const interleaved = _.flatten(_.zip(newBase, oldBase)).filter((e): e is BaseEntry => !!e);
        stamp.evidentialBase = interleaved.slice(0, Parameters.MAXIMUM_EVIDENTIAL_BASE_LENGTH);

        // Update creation time
        stamp.creationTime = MemoryStore.getState().time.narsClock();

        // Update occurrence time
        if (!stampOne.isEternal && !stampTwo.isEternal) {
            stamp.occurrenceTime = Math.max(stampOne.occurrenceTime, stampTwo.occurrenceTime);
        }
        if (!stampOne.isEternal) {
            const intervalMap: Record<string, number> = {
                "&/": Parameters.DURATION,
                "=/>": Parameters.DURATION,
                "</>": Parameters.DURATION,
                "=\\>": -Parameters.DURATION
            };
            let interval = orderMark ? intervalMap[orderMark] || 0 : 0;
            if (reverseOrder) interval = -interval;
            stamp.occurrenceTime += interval + tBias;
        }
        return stamp;
    }
}  