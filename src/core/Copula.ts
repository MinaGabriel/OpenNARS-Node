/**
 * Refactored Copula class for use in NARS + PEG.js integration
 */

// Enum is no longer strictly needed if we use a lookup map
const CopulaSymbols = {
    "-->": "Inheritance",
    "<->": "Similarity",
    "{--": "Instance",
    "--]": "Property",
    "{-]": "InstanceProperty",
    "==>": "Implication",
    "=/>": "PredictiveImplication",
    "=|>": "ConcurrentImplication",
    "=\\>": "RetrospectiveImplication",
    "<=>": "Equivalence",
    "</>": "PredictiveEquivalence",
    "<|>": "ConcurrentEquivalence"
  } as const;
  
  export type CopulaSymbol = keyof typeof CopulaSymbols;
  
  export class Copula { 
    public readonly symbol: CopulaSymbol;
  
    private constructor(name: string, symbol: CopulaSymbol) { 
      this.symbol = symbol;
    }
  
    toString(): string { return this.symbol; }
  
    public isHigherOrder(): boolean {
      return [
        "==>", "<=>", "=/>", "=|>", "=\\>", "</>", "<|>"
      ].includes(this.symbol);
    }
  
    public isInheritanceOrSimilarity(): boolean {
      return this.symbol === "-->" || this.symbol === "<->";
    }
  
    // Static map for quick lookup
    private static symbolMap: Record<CopulaSymbol, Copula> = Object.entries(CopulaSymbols)
      .reduce((map, [symbol, name]) => {
        map[symbol as CopulaSymbol] = new Copula(name, symbol as CopulaSymbol);
        return map;
      }, {} as Record<CopulaSymbol, Copula>);
  
    /**
     * Lookup Copula by symbol
     */
    public static fromSymbol(symbol: string): Copula | undefined {
      return Copula.symbolMap[symbol as CopulaSymbol];
    }
  
    
  }
  
  // PEG.js Copula rule should call: Copula.fromSymbol(value)