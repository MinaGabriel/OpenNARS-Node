class TermType {
    private readonly value: number;
    private readonly name: string;

    static readonly ATOM = new TermType(0, 'ATOM');
    static readonly STATEMENT = new TermType(1, 'STATEMENT');
    static readonly COMPOUND = new TermType(2, 'COMPOUND');

    private static readonly _values: readonly TermType[] = Object.freeze([
        TermType.ATOM,
        TermType.STATEMENT,
        TermType.COMPOUND
    ]);

    /**
     * Create a new TermType
     * @param value - Numeric value of the term type
     * @param name - String name of the term type
     */
    constructor(value: number, name: string) {
        this.value = value;
        this.name = name;
        Object.freeze(this);
    }

    /**
     * Get TermType by numeric value
     * @param value - Value to look up
     * @returns Matching TermType or undefined
     */
    static fromValue(value: number): TermType | undefined {
        return TermType._values.find(type => type.value === value);
    }

    /**
     * Get TermType by name
     * @param name - Name to look up
     * @returns Matching TermType or undefined
     */
    static fromName(name: string): TermType | undefined {
        return TermType._values.find(type => type.name === name);
    }

    /**
     * Get string representation
     * @returns Name of the term type
     */
    toString(): string {
        return this.name;
    }
}

export { TermType };
