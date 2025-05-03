/**
 * Copula class for handling logical relationships in NARS
 */
class Copula {
    readonly name: string;
    readonly value: string;

    /**
     * Create a new Copula instance
     * @param name - Name of the copula
     * @param symbol - Symbolic representation of the copula
     */
    constructor(name: string, symbol: string) {
        this.name = name;
        this.value = symbol;
        Object.freeze(this); // Make instances immutable
    }

    /**
     * String representation of the copula
     * @returns Symbolic representation
     */
    toString(): string {
        return this.value;
    }

    // === Properties ===

    get is_commutative(): boolean {
        return [
            Copula.Similarity,
            Copula.Equivalence,
            Copula.ConcurrentEquivalence
        ].includes(this);
    }

    get is_higher_order(): boolean {
        return [
            Copula.Implication,
            Copula.PredictiveImplication,
            Copula.ConcurrentImplication,
            Copula.RetrospectiveImplication,
            Copula.Equivalence,
            Copula.PredictiveEquivalence,
            Copula.ConcurrentEquivalence
        ].includes(this);
    }

    get is_temporal(): boolean {
        return [
            Copula.ConcurrentEquivalence,
            Copula.PredictiveEquivalence,
            Copula.ConcurrentImplication,
            Copula.PredictiveImplication,
            Copula.RetrospectiveImplication
        ].includes(this);
    }

    get get_atemporal(): Copula {
        if (
            this === Copula.PredictiveImplication ||
            this === Copula.ConcurrentImplication ||
            this === Copula.RetrospectiveImplication
        ) {
            return Copula.Implication;
        }
        if (
            this === Copula.PredictiveEquivalence ||
            this === Copula.ConcurrentEquivalence
        ) {
            return Copula.Equivalence;
        }
        return this;
    }

    get is_predictive(): boolean {
        return (
            this === Copula.PredictiveEquivalence ||
            this === Copula.PredictiveImplication
        );
    }

    get is_concurrent(): boolean {
        return (
            this === Copula.ConcurrentEquivalence ||
            this === Copula.ConcurrentImplication
        );
    }

    get is_retrospective(): boolean {
        return this === Copula.RetrospectiveImplication;
    }

    get get_concurrent(): Copula {
        if (this === Copula.Implication) return Copula.ConcurrentImplication;
        if (this === Copula.Equivalence) return Copula.ConcurrentEquivalence;
        return this;
    }

    get get_predictive(): Copula {
        if (this === Copula.Implication) return Copula.PredictiveImplication;
        if (this === Copula.Equivalence) return Copula.PredictiveEquivalence;
        return this;
    }

    get get_retrospective(): Copula {
        if (this === Copula.Implication) return Copula.RetrospectiveImplication;
        return this;
    }

    get get_temporal_swapped(): Copula {
        if (this === Copula.PredictiveImplication) return Copula.RetrospectiveImplication;
        if (this === Copula.RetrospectiveImplication) return Copula.PredictiveImplication;
        return this;
    }

    get reverse(): Copula {
        return this.get_temporal_swapped;
    }

    symmetrize(): Copula {
        switch (this) {
            case Copula.Inheritance: return Copula.Similarity;
            case Copula.Implication: return Copula.Equivalence;
            case Copula.ConcurrentImplication: return Copula.ConcurrentEquivalence;
            case Copula.PredictiveImplication: return Copula.PredictiveEquivalence;
            default:
                throw new Error("Invalid case in symmetrize.");
        }
    }

    // === Enum-like static members ===

    static readonly Inheritance = new Copula("Inheritance", "-->");
    static readonly Similarity = new Copula("Similarity", "<->");
    static readonly Instance = new Copula("Instance", "{--");
    static readonly Property = new Copula("Property", "--]");
    static readonly InstanceProperty = new Copula("InstanceProperty", "{-]");
    static readonly Implication = new Copula("Implication", "==>");
    static readonly PredictiveImplication = new Copula("PredictiveImplication", "=/>");
    static readonly ConcurrentImplication = new Copula("ConcurrentImplication", "=|>");
    static readonly RetrospectiveImplication = new Copula("RetrospectiveImplication", "=\\>");
    static readonly Equivalence = new Copula("Equivalence", "<=>");
    static readonly PredictiveEquivalence = new Copula("PredictiveEquivalence", "</>");
    static readonly ConcurrentEquivalence = new Copula("ConcurrentEquivalence", "<|>");

    /**
     * Get all Copula values
     * @returns Array of all Copula instances
     */
    static values(): Copula[] {
        return [
            Copula.Inheritance,
            Copula.Similarity,
            Copula.Instance,
            Copula.Property,
            Copula.InstanceProperty,
            Copula.Implication,
            Copula.PredictiveImplication,
            Copula.ConcurrentImplication,
            Copula.RetrospectiveImplication,
            Copula.Equivalence,
            Copula.PredictiveEquivalence,
            Copula.ConcurrentEquivalence
        ];
    }

    /**
     * Get a Copula instance by its symbol
     * @param symbol - Symbol of the Copula
     * @returns Copula instance or undefined
     */
    static fromSymbol(symbol: string): Copula | undefined {
        return Copula.values().find(c => c.value === symbol);
    }

    /**
     * Get a Copula instance by its name
     * @param name - Name of the Copula
     * @returns Copula instance or undefined
     */
    static fromName(name: string): Copula | undefined {
        return Copula.values().find(c => c.name === name);
    }
}

export { Copula };
