/**
 * Copula class for handling logical relationships in NARS
 */
enum CopulaType {
    Inheritance = "-->",
    Similarity = "<->",
    Instance = "{--",
    Property = "--]",
    InstanceProperty = "{-]",
    Implication = "==>",
    PredictiveImplication = "=/>",
    ConcurrentImplication = "=|>",
    RetrospectiveImplication = "=\\>",
    Equivalence = "<=>",
    PredictiveEquivalence = "</>",
    ConcurrentEquivalence = "<|>"
}

class Copula {
    private readonly name: string;
    private readonly symbol: string;
 
    constructor(name: string, symbol: string) {
        this.name = name;
        this.symbol = symbol;
    }
 
    public getName(): string {
        return this.name;
    }

    public getSymbol(): string {
        return this.symbol;
    }

    public toString(): string {
        return this.symbol;
    }

    // Static instances
    public static readonly Inheritance = new Copula("Inheritance", CopulaType.Inheritance);
    public static readonly Similarity = new Copula("Similarity", CopulaType.Similarity);
    public static readonly Instance = new Copula("Instance", CopulaType.Instance);
    public static readonly Property = new Copula("Property", CopulaType.Property);
    public static readonly InstanceProperty = new Copula("InstanceProperty", CopulaType.InstanceProperty);
    public static readonly Implication = new Copula("Implication", CopulaType.Implication);
    public static readonly PredictiveImplication = new Copula("PredictiveImplication", CopulaType.PredictiveImplication);
    public static readonly ConcurrentImplication = new Copula("ConcurrentImplication", CopulaType.ConcurrentImplication);
    public static readonly RetrospectiveImplication = new Copula("RetrospectiveImplication", CopulaType.RetrospectiveImplication);
    public static readonly Equivalence = new Copula("Equivalence", CopulaType.Equivalence);
    public static readonly PredictiveEquivalence = new Copula("PredictiveEquivalence", CopulaType.PredictiveEquivalence);
    public static readonly ConcurrentEquivalence = new Copula("ConcurrentEquivalence", CopulaType.ConcurrentEquivalence);

    public static values(): Copula[] {
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
     * Lookup Copula by symbol
     */
    public static FromSymbol(symbol: string): Copula | undefined {
        return Copula.values().find(c => c.getSymbol() === symbol);
    }

    /**
     * Lookup Copula by name
     */
    public static FromName(name: string): Copula | undefined {
        return Copula.values().find(c => c.getName() === name);
    }

    
}

export { Copula, CopulaType };
