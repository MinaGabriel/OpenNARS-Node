// TypeScript implementation of NARS truth functions, based on OpenNARS (TruthFunctions.java)
// and PyNARS truth functions, following Non-Axiomatic Logic by Pei Wang (2013).
// All functions compute truth values (frequency, confidence) for NARS inference rules.

// Interface for NARS parameters, controlling truth calculations
interface TruthParameters {
    k: number; // Evidence horizon, default 1.0 (affects confidence)
    PROJECTION_DECAY: number; // Temporal projection decay factor
}

// Interface for a truth value in NARS
interface TruthValue {
    frequency: number; // Degree of positive evidence [0, 1]
    confidence: number; // Proportion of evidence [0, 1)
    isAnalytic?: boolean; // Whether truth is analytic (default false)
}

// Interface for eternalized truth value (for temporal projection)
interface EternalizedTruthValue extends TruthValue { }

// Enum for truth function types (mirrors OpenNARS EnumType)
enum TruthFunctionType {
    DESIREDED = 'DESIREDED',
    DESIREIND = 'DESIREIND',
    DESIREWEAK = 'DESIREWEAK',
    DESIRESTRONG = 'DESIRESTRONG',
    COMPARISON = 'COMPARISON',
    ANALOGY = 'ANALOGY',
    ANONYMOUSANALOGY = 'ANONYMOUSANALOGY',
    DEDUCTION = 'DEDUCTION',
    EXEMPLIFICATION = 'EXEMPLIFICATION',
    ABDUCTION = 'ABDUCTION',
    RESEMBLENCE = 'RESEMBLENCE',
    REDUCECONJUNCTION = 'REDUCECONJUNCTION',
    REDUCEDISJUNCTION = 'REDUCEDISJUNCTION',
    REDUCEDISJUNCTIONREV = 'REDUCEDISJUNCTIONREV',
    REDUCECONJUNCTIONNEG = 'REDUCECONJUNCTIONNEG',
}

// Utility functions for logical operations
class UtilityFunctions {
    // Logical AND (minimum of values)
    // Example: and(0.9, 0.7, 1.0) = 0.7
    static and(...values: number[]): number {
        return Math.min(...values);
    }

    // Logical OR (maximum of values)
    // Example: or(0.9, 0.7) = 0.9
    static or(...values: number[]): number {
        return Math.max(...values);
    }

    // Logical NOT (1 - value)
    // Example: not(0.9) = 0.1
    static not(value: number): number {
        return 1 - value;
    }

    // Convert confidence to evidence weight (w = c / (1 - c))
    // Example: c = 0.9, k = 1 → w = 0.9 / 0.1 = 9.0
    static c2w(c: number, params: TruthParameters): number {
        return (c / (1 - c)) * params.k;
    }

    // Convert evidence weight to confidence (c = w / (w + k))
    // Example: w = 9.0, k = 1 → c = 9.0 / (9.0 + 1) = 0.9
    static w2c(w: number, params: TruthParameters): number {
        return w / (w + params.k);
    }

    // Convert frequency and confidence to positive evidence (w⁺ = k * f * c / (1 - c))
    // Example: f = 1.0, c = 0.9, k = 1 → w⁺ = 1 * 1.0 * 0.9 / 0.1 = 9.0
    static fcToWPlus(f: number, c: number, params: TruthParameters): number {
        return (params.k * f * c) / (1 - c);
    }

    // Convert frequency and confidence to negative evidence (w⁻ = k * (1 - f) * c / (1 - c))
    // Example: f = 1.0, c = 0.9, k = 1 → w⁻ = 1 * (1 - 1.0) * 0.9 / 0.1 = 0.0
    static fcToWMinus(f: number, c: number, params: TruthParameters): number {
        return (params.k * (1 - f) * c) / (1 - c);
    }

    // Convert evidence to frequency (f = w⁺ / w)
    // Example: w⁺ = 9.0, w = 9.0 → f = 9.0 / 9.0 = 1.0
    static wToF(wPlus: number, w: number): number {
        return w === 0 ? 0.5 : wPlus / w;
    }

    // Create truth value from evidence
    // Example: w⁺ = 18.0, w = 18.0, k = 1 → f = 1.0, c = 18.0 / (18.0 + 1) ≈ 0.947
    static truthFromW(wPlus: number, w: number, params: TruthParameters): TruthValue {
        const f = w === 0 ? 0.5 : UtilityFunctions.wToF(wPlus, w);
        const c = w === 0 ? 0.0 : UtilityFunctions.w2c(w, params);
        return { frequency: f, confidence: c };
    }
}

class TruthFunctions {
    // Default parameters
    private static defaultParams: TruthParameters = { k: 1.0, PROJECTION_DECAY: 0.00001 };

    // Lookup and compute truth function by type
    // Example: type = DEDUCTION, a = {1.0, 0.9}, b = {0.8, 0.7} → deduction result
    static lookupTruthFunctionAndCompute(
        type: TruthFunctionType,
        a: TruthValue,
        b: TruthValue,
        params: TruthParameters = TruthFunctions.defaultParams
    ): TruthValue {
        switch (type) {
            case TruthFunctionType.DESIREDED:
                return this.desireDed(a, b, params);
            case TruthFunctionType.DESIREIND:
                return this.desireInd(a, b, params);
            case TruthFunctionType.DESIREWEAK:
                return this.desireWeak(a, b, params);
            case TruthFunctionType.DESIRESTRONG:
                return this.desireStrong(a, b, params);
            case TruthFunctionType.COMPARISON:
                return this.comparison(a, b, params);
            case TruthFunctionType.ANALOGY:
                return this.analogy(a, b, params);
            case TruthFunctionType.ANONYMOUSANALOGY:
                return this.anonymousAnalogy(a, b, params);
            case TruthFunctionType.DEDUCTION:
                return this.deduction(a, b, params);
            case TruthFunctionType.EXEMPLIFICATION:
                return this.exemplification(a, b, params);
            case TruthFunctionType.ABDUCTION:
                return this.abduction(a, b, params);
            case TruthFunctionType.RESEMBLENCE:
                return this.resemblance(a, b, params);
            case TruthFunctionType.REDUCECONJUNCTION:
                return this.reduceConjunction(a, b, params);
            case TruthFunctionType.REDUCEDISJUNCTION:
                return this.reduceDisjunction(a, b, params);
            case TruthFunctionType.REDUCEDISJUNCTIONREV:
                return this.reduceDisjunction(b, a, params);
            case TruthFunctionType.REDUCECONJUNCTIONNEG:
                return this.reduceConjunctionNeg(a, b, params);
            default:
                throw new Error(`Unimplemented truth function: ${type}`);
        }
    }

    // Lookup truth function based on boolean condition
    // Example: flag = true, typeTrue = DEDUCTION → compute deduction
    static lookupTruthFunctionByBoolAndCompute(
        flag: boolean,
        typeTrue: TruthFunctionType,
        typeFalse: TruthFunctionType,
        a: TruthValue,
        b: TruthValue,
        params: TruthParameters = TruthFunctions.defaultParams
    ): TruthValue {
        const type = flag ? typeTrue : typeFalse;
        return this.lookupTruthFunctionAndCompute(type, a, b, params);
    }

    // Lookup first true condition and compute truth, or return null
    // Example: conditions = [true, DEDUCTION, false, ANALOGY] → compute deduction
    static lookupTruthOrNull(
        a: TruthValue,
        b: TruthValue,
        params: TruthParameters = TruthFunctions.defaultParams,
        ...conditions: (boolean | TruthFunctionType)[]
    ): TruthValue | null {
        for (let i = 0; i < conditions.length; i += 2) {
            if (conditions[i] === true) {
                return this.lookupTruthFunctionAndCompute(conditions[i + 1] as TruthFunctionType, a, b, params);
            }
        }
        return null;
    }

    /* ----- Single Argument Functions ----- */

    // Conversion: Derives <B ==> A> from <A ==> B>
    // Formula: f' = 1.0, c' = w2c(min(f1, c1))
    // Example: <A --> B>. %1.00;0.90% → <B --> A>. %1.00;0.474%
    static conversion(v1: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const c1 = v1.confidence;
        const w = UtilityFunctions.and(f1, c1);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: 1.0, confidence: c };
    }

    // Negation: Derives (--A) from A
    // Formula: f' = 1 - f1, c' = c1
    // Example: <A --> B>. %1.00;0.90% → (-- <A --> B>). %0.00;0.90%
    static negation(v1: TruthValue, params: TruthParameters): TruthValue {
        const f = 1 - v1.frequency;
        const c = v1.confidence;
        return { frequency: f, confidence: c };
    }

    // Contraposition: Derives <(--, B) ==> (--, A)> from <A ==> B>
    // Formula: f' = 0.0, c' = w2c(min(1 - f1, c1))
    // Example: <A --> B>. %1.00;0.90% → <(--, B) --> (--, A)>. %0.00;0.00%
    static contraposition(v1: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const c1 = v1.confidence;
        const w = UtilityFunctions.and(1 - f1, c1);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: 0.0, confidence: c };
    }

    /* ----- Double Argument Functions ----- */

    // Revision: Combines two truths for the same statement
    // Formula: w1 = c1 / (1 - c1), w2 = c2 / (1 - c2), f' = (w1*f1 + w2*f2) / (w1 + w2), c' = w2c(w1 + w2)
    // Example: <A --> B>. %1.00;0.90% and <A --> B>. %1.00;0.90% → %1.00;0.947%
    static revision(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const w1 = UtilityFunctions.c2w(v1.confidence, params);
        const w2 = UtilityFunctions.c2w(v2.confidence, params);
        const w = w1 + w2;
        const f = (w1 * f1 + w2 * f2) / w;
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: f, confidence: c };
    }

    // Deduction: Derives <S ==> P> from <S ==> M> and <M ==> P>
    // Formula: f' = min(f1, f2), c' = min(c1, c2, f1, f2)
    // Example: <A --> B>. %1.00;0.90%, <B --> C>. %0.80;0.70% → <A --> C>. %0.80;0.70%
    static deduction(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2, f);
        return { frequency: f, confidence: c };
    }

    // Deduction (single premise): Derives P from M and <M ==> P>
    // Formula: f' = f1, c' = min(f1, c1, reliance)
    // Example: M. %1.00;0.90%, <M --> P>. %1.00;1.00% (reliance=1.0) → P. %1.00;0.90%
    static deductionWithReliance(v1: TruthValue, reliance: number, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const c1 = v1.confidence;
        const c = UtilityFunctions.and(f1, c1, reliance);
        return { frequency: f1, confidence: c, isAnalytic: true };
    }

    // Analogy: Derives <S ==> P> from <S ==> M> and <M <=> P>
    // Formula: f' = min(f1, f2), c' = min(c1, c2, f2)
    // Example: <A --> B>. %1.00;0.90%, <B <-> C>. %0.80;0.70% → <A --> C>. %0.80;0.70%
    static analogy(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2, f2);
        return { frequency: f, confidence: c };
    }

    // Resemblance: Derives <S <=> P> from <S <=> M> and <M <=> P>
    // Formula: f' = min(f1, f2), c' = min(c1, c2, max(f1, f2))
    // Example: <A <-> B>. %1.00;0.90%, <B <-> C>. %0.80;0.70% → <A <-> C>. %0.80;0.70%
    static resemblance(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2, UtilityFunctions.or(f1, f2));
        return { frequency: f, confidence: c };
    }

    // Abduction: Derives <S ==> P> from <S ==> M> and <P ==> M>
    // Formula: f' = f1, c' = w2c(min(f2, c1, c2))
    // Example: <A --> C>. %1.00;0.90%, <B --> C>. %0.80;0.70% → <A --> B>. %1.00;0.70%
    static abduction(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        if (v1.isAnalytic || v2.isAnalytic) {
            return { frequency: 0.5, confidence: 0.0 };
        }
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const w = UtilityFunctions.and(f2, c1, c2);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: f1, confidence: c };
    }

    // Abduction (single premise): Derives P from M and <P ==> M>
    // Formula: f' = f1, c' = w2c(min(c1, reliance))
    // Example: M. %1.00;0.90%, <P --> M>. %1.00;1.00% (reliance=1.0) → P. %1.00;0.474%
    static abductionWithReliance(v1: TruthValue, reliance: number, params: TruthParameters): TruthValue {
        if (v1.isAnalytic) {
            return { frequency: 0.5, confidence: 0.0 };
        }
        const f1 = v1.frequency;
        const c1 = v1.confidence;
        const w = UtilityFunctions.and(c1, reliance);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: f1, confidence: c, isAnalytic: true };
    }

    // Induction: Derives <S ==> P> from <M ==> S> and <M ==> P>
    // Formula: Same as abduction(v2, v1)
    // Example: <B --> A>. %1.00;0.90%, <B --> C>. %0.80;0.70% → <A --> C>. %0.80;0.70%
    static induction(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        return this.abduction(v2, v1, params);
    }

    // Exemplification: Derives <S ==> P> from <M ==> S> and <P ==> M>
    // Formula: f' = 1.0, c' = w2c(min(f1, f2, c1, c2))
    // Example: <B --> A>. %1.00;0.90%, <C --> B>. %0.80;0.70% → <A --> C>. %1.00;0.70%
    static exemplification(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        if (v1.isAnalytic || v2.isAnalytic) {
            return { frequency: 0.5, confidence: 0.0 };
        }
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const w = UtilityFunctions.and(f1, f2, c1, c2);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: 1.0, confidence: c };
    }

    // Comparison: Derives <S <=> P> from <M ==> S> and <M ==> P>
    // Formula: f' = min(f1, f2) / max(f1, f2), c' = w2c(min(max(f1, f2), c1, c2))
    // Example: <B --> A>. %1.00;0.90%, <B --> C>. %0.80;0.70% → <A <-> C>. %0.80;0.70%
    static comparison(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f0 = UtilityFunctions.or(f1, f2);
        const f = f0 === 0 ? 0 : UtilityFunctions.and(f1, f2) / f0;
        const w = UtilityFunctions.and(f0, c1, c2);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: f, confidence: c };
    }

    // Desire Strong: Derives desire for <S ==> P> (goal reasoning)
    // Formula: f' = min(f1, f2), c' = min(c1, c2, f2)
    // Example: <A --> B>. %1.00;0.90%, <B --> goal>. %0.80;0.70% → <A --> goal>. %0.80;0.70%
    static desireStrong(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2, f2);
        return { frequency: f, confidence: c };
    }

    // Desire Weak: Derives desire with lower confidence
    // Formula: f' = min(f1, f2), c' = min(c1, c2, f2, w2c(1.0))
    // Example: <A --> B>. %1.00;0.90%, <B --> goal>. %0.80;0.70% → <A --> goal>. %0.80;0.50%
    static desireWeak(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2, f2, UtilityFunctions.w2c(1.0, params));
        return { frequency: f, confidence: c };
    }

    // Desire Deduction: Derives desire via deduction
    // Formula: f' = min(f1, f2), c' = min(c1, c2)
    // Example: <A --> B>. %1.00;0.90%, <B --> goal>. %0.80;0.70% → <A --> goal>. %0.80;0.70%
    static desireDed(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2);
        return { frequency: f, confidence: c };
    }

    // Desire Induction: Derives desire via induction
    // Formula: f' = f1, c' = w2c(min(f2, c1, c2))
    // Example: <A --> B>. %1.00;0.90%, <goal --> B>. %0.80;0.70% → <goal --> A>. %1.00;0.70%
    static desireInd(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const w = UtilityFunctions.and(f2, c1, c2);
        const c = UtilityFunctions.w2c(w, params);
        return { frequency: f1, confidence: c };
    }

    // Union: Derives <M --> (S|P)> from <M --> S> and <M --> P>
    // Formula: f' = max(f1, f2), c' = min(c1, c2)
    // Example: <M --> A>. %1.00;0.90%, <M --> B>. %0.80;0.70% → <M --> (A|B)>. %1.00;0.70%
    static union(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.or(f1, f2);
        const c = UtilityFunctions.and(c1, c2);
        return { frequency: f, confidence: c };
    }

    // Intersection: Derives <M --> (S&P)> from <M --> S> and <M --> P>
    // Formula: f' = min(f1, f2), c' = min(c1, c2)
    // Example: <M --> A>. %1.00;0.90%, <M --> B>. %0.80;0.70% → <M --> (A&B)>. %0.80;0.70%
    static intersection(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const f2 = v2.frequency;
        const c1 = v1.confidence;
        const c2 = v2.confidence;
        const f = UtilityFunctions.and(f1, f2);
        const c = UtilityFunctions.and(c1, c2);
        return { frequency: f, confidence: c };
    }

    // Reduce Disjunction: Derives A from (||, A, B) and (--, B)
    // Formula: Intersection of (||, A, B) and not(B), then deduce
    // Example: <(A|B)>. %1.00;0.90%, <(--, B)>. %0.00;0.70% → <A>. %1.00;0.70%
    static reduceDisjunction(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const v0 = this.intersection(v1, this.negation(v2, params), params);
        return this.deductionWithReliance(v0, 1.0, params);
    }

    // Reduce Conjunction: Derives (--, A) from (--, (&&, A, B)) and B
    // Formula: Intersection of not(A&B) and B, deduce, then negate
    // Example: <(--, (A&B))>. %0.00;0.90%, <B>. %1.00;0.70% → <(--, A)>. %0.00;0.70%
    static reduceConjunction(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const v0 = this.intersection(this.negation(v1, params), v2, params);
        return this.negation(this.deductionWithReliance(v0, 1.0, params), params);
    }

    // Reduce Conjunction Neg: Derives (--, A) from (--, (&&, A, (--, B))) and (--, B)
    // Formula: Same as reduceConjunction with negated B
    // Example: <(--, (A&(--, B)))>. %0.00;0.90%, <(--, B)>. %0.00;0.70% → <(--, A)>. %0.00;0.70%
    static reduceConjunctionNeg(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        return this.reduceConjunction(v1, this.negation(v2, params), params);
    }

    // Anonymous Analogy: Derives <S ==> P> with variable substitution
    // Formula: Adjust v1 confidence, then apply analogy
    // Example: <M --> P>. %1.00;0.90%, <S --> M>. %0.80;0.70% → <S --> P>. %0.80;0.474%
    static anonymousAnalogy(v1: TruthValue, v2: TruthValue, params: TruthParameters): TruthValue {
        const f1 = v1.frequency;
        const c1 = v1.confidence;
        const v0: TruthValue = { frequency: f1, confidence: UtilityFunctions.w2c(c1, params) };
        return this.analogy(v2, v0, params);
    }

    // Eternalize: Projects truth to eternal time
    // Formula: f' = f1, c' = w2c(c1)
    // Example: <A --> B>. %1.00;0.90% → %1.00;0.474%
    static eternalize(v1: TruthValue, params: TruthParameters): EternalizedTruthValue {
        const f1 = v1.frequency;
        const c1 = v1.confidence;
        const c = UtilityFunctions.w2c(c1, params);
        return { frequency: f1, confidence: c };
    }

    // Temporal Projection: Adjusts confidence based on time difference
    // Formula: c' = 1 - |sourceTime - targetTime| / (|sourceTime - currentTime| + |targetTime - currentTime| + a)
    // Example: sourceTime = 0, targetTime = 10, currentTime = 5 → confidence factor ≈ 0.833
    static temporalProjection(sourceTime: number, targetTime: number, currentTime: number, params: TruthParameters): number {
        const a = 100000.0 * params.PROJECTION_DECAY;
        return (1.0 - Math.abs(sourceTime - targetTime) / (Math.abs(sourceTime - currentTime) + Math.abs(targetTime - currentTime) + a)
        );
    }
}

