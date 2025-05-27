import { Base } from './Base';
import { Tense } from './Tense';
/**
 * Represents a temporal and evidential stamp for a sentence or event.
 */
class Stamp {
    /** Creation time of the stamp */
    public creationTime: number;

    /** Estimated occurrence time of the event (null means eternal) */
    public occurrenceTime: number | null;

    /** Time when the stamp was put into buffer */
    public putTime: number;

    //TOOBAD
    evidentialBase: Base;

    //TOOBAD
    // whether a sentence is from the external world or the internal world. Only those sentences derived from Mental Operations are internal.
    public isEternal: boolean;


    constructor(
        creationTime: number,
        occurrenceTime: number | null,
        putTime: number,
        evidentialBase: Base
    ) {
        this.creationTime = creationTime;
        this.occurrenceTime = occurrenceTime;
        this.putTime = putTime;
        this.evidentialBase = evidentialBase;
        //TOOBAD
        // according to OpenNARS 4:
        this.isEternal = occurrenceTime === null;
    }




}

export { Stamp };
