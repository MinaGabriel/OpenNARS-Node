// Updated TruthFunctions.ts
// Assumes Truth is a class with static utility methods and no longer needs external parameters.

export class Truth {
    constructor(public frequency: number, public confidence: number, public isAnalytic: boolean = false) {}

    static and(...values: number[]): number {
        return Math.min(...values);
    }

    static or(...values: number[]): number {
        return Math.max(...values);
    }

    static not(value: number): number {
        return 1 - value;
    }

    static c2w(c: number): number {
        return c / (1 - c);
    }

    static w2c(w: number): number {
        return w / (w + 1);
    }

    static fcToWPlus(f: number, c: number): number {
        return (f * c) / (1 - c);
    }

    static fcToWMinus(f: number, c: number): number {
        return ((1 - f) * c) / (1 - c);
    }

    static wToF(wPlus: number, w: number): number {
        return w === 0 ? 0.5 : wPlus / w;
    }

    static truthFromW(wPlus: number, w: number): Truth {
        const f = this.wToF(wPlus, w);
        const c = this.w2c(w);
        return new Truth(f, c);
    }

    static conversion(v: Truth): Truth {
        const w = this.and(v.frequency, v.confidence);
        return new Truth(1.0, this.w2c(w));
    }

    static negation(v: Truth): Truth {
        return new Truth(1 - v.frequency, v.confidence);
    }

    static contraposition(v: Truth): Truth {
        const w = this.and(1 - v.frequency, v.confidence);
        return new Truth(0.0, this.w2c(w));
    }

    static revision(v1: Truth, v2: Truth): Truth {
        const w1 = this.c2w(v1.confidence);
        const w2 = this.c2w(v2.confidence);
        const w = w1 + w2;
        const f = (w1 * v1.frequency + w2 * v2.frequency) / w;
        return new Truth(f, this.w2c(w));
    }

    static deduction(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence, f);
        return new Truth(f, c);
    }

    static deductionWithReliance(v: Truth, reliance: number): Truth {
        const c = this.and(v.frequency, v.confidence, reliance);
        return new Truth(v.frequency, c, true);
    }

    static analogy(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence, v2.frequency);
        return new Truth(f, c);
    }

    static resemblance(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence, this.or(v1.frequency, v2.frequency));
        return new Truth(f, c);
    }

    static abduction(v1: Truth, v2: Truth): Truth {
        if (v1.isAnalytic || v2.isAnalytic) return new Truth(0.5, 0.0);
        const w = this.and(v2.frequency, v1.confidence, v2.confidence);
        return new Truth(v1.frequency, this.w2c(w));
    }

    static abductionWithReliance(v: Truth, reliance: number): Truth {
        if (v.isAnalytic) return new Truth(0.5, 0.0);
        const w = this.and(v.confidence, reliance);
        return new Truth(v.frequency, this.w2c(w), true);
    }

    static exemplification(v1: Truth, v2: Truth): Truth {
        if (v1.isAnalytic || v2.isAnalytic) return new Truth(0.5, 0.0);
        const w = this.and(v1.frequency, v2.frequency, v1.confidence, v2.confidence);
        return new Truth(1.0, this.w2c(w));
    }

    static comparison(v1: Truth, v2: Truth): Truth {
        const f0 = this.or(v1.frequency, v2.frequency);
        const f = f0 === 0 ? 0 : this.and(v1.frequency, v2.frequency) / f0;
        const w = this.and(f0, v1.confidence, v2.confidence);
        return new Truth(f, this.w2c(w));
    }

    static desireStrong(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence, v2.frequency);
        return new Truth(f, c);
    }

    static desireWeak(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence, v2.frequency, this.w2c(1.0));
        return new Truth(f, c);
    }

    static desireDed(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence);
        return new Truth(f, c);
    }

    static desireInd(v1: Truth, v2: Truth): Truth {
        const w = this.and(v2.frequency, v1.confidence, v2.confidence);
        return new Truth(v1.frequency, this.w2c(w));
    }

    static union(v1: Truth, v2: Truth): Truth {
        const f = this.or(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence);
        return new Truth(f, c);
    }

    static intersection(v1: Truth, v2: Truth): Truth {
        const f = this.and(v1.frequency, v2.frequency);
        const c = this.and(v1.confidence, v2.confidence);
        return new Truth(f, c);
    }

    static reduceDisjunction(v1: Truth, v2: Truth): Truth {
        const v0 = this.intersection(v1, this.negation(v2));
        return this.deductionWithReliance(v0, 1.0);
    }

    static reduceConjunction(v1: Truth, v2: Truth): Truth {
        const v0 = this.intersection(this.negation(v1), v2);
        return this.negation(this.deductionWithReliance(v0, 1.0));
    }

    static reduceConjunctionNeg(v1: Truth, v2: Truth): Truth {
        return this.reduceConjunction(v1, this.negation(v2));
    }

    static anonymousAnalogy(v1: Truth, v2: Truth): Truth {
        const v0 = new Truth(v1.frequency, this.w2c(v1.confidence));
        return this.analogy(v2, v0);
    }

    static eternalize(v: Truth): Truth {
        return new Truth(v.frequency, this.w2c(v.confidence));
    }
}
