/**
 * Connector class for handling logical and temporal connectors in NARS
 */
class Connector {
    // Enum for Connector Types
    static Type = {
        CONJUNCTION: 'CONJUNCTION',             // &&
        DISJUNCTION: 'DISJUNCTION',             // ||
        PRODUCT: 'PRODUCT',                     // *
        PARALLEL_EVENTS: 'PARALLEL_EVENTS',     // &|
        SEQUENTIAL_EVENTS: 'SEQUENTIAL_EVENTS', // &/
        INTENSIONAL_INTERSECTION: 'INTENSIONAL_INTERSECTION', // |
        EXTENSIONAL_INTERSECTION: 'EXTENSIONAL_INTERSECTION', // &
        EXTENSIONAL_DIFFERENCE: 'EXTENSIONAL_DIFFERENCE',     // -
        INTENSIONAL_DIFFERENCE: 'INTENSIONAL_DIFFERENCE',     // ~
        NEGATION: 'NEGATION',                   // --
        INTENSIONAL_SET: 'INTENSIONAL_SET',     // [
        EXTENSIONAL_SET: 'EXTENSIONAL_SET',     // {
        INTENSIONAL_IMAGE: 'INTENSIONAL_IMAGE', // \
        EXTENSIONAL_IMAGE: 'EXTENSIONAL_IMAGE', // /
        LIST: 'LIST'                            // #
    } as const;

    private type_: keyof typeof Connector.Type;

    /**
     * Create a new Connector instance
     * @param type - Type of the connector
     */
    constructor(type: keyof typeof Connector.Type) {
        this.type_ = type;
    }

    /**
     * String representation of the connector
     * @returns Symbolic representation of the connector
     */
    toString(): string {
        switch (this.type_) {
            case Connector.Type.CONJUNCTION: return "&&";
            case Connector.Type.DISJUNCTION: return "||";
            case Connector.Type.PRODUCT: return "*";
            case Connector.Type.PARALLEL_EVENTS: return "&|";
            case Connector.Type.SEQUENTIAL_EVENTS: return "&/";
            case Connector.Type.INTENSIONAL_INTERSECTION: return "|";
            case Connector.Type.EXTENSIONAL_INTERSECTION: return "&";
            case Connector.Type.EXTENSIONAL_DIFFERENCE: return "-";
            case Connector.Type.INTENSIONAL_DIFFERENCE: return "~";
            case Connector.Type.NEGATION: return "--";
            case Connector.Type.INTENSIONAL_SET: return "[";
            case Connector.Type.EXTENSIONAL_SET: return "{";
            case Connector.Type.INTENSIONAL_IMAGE: return "\\";
            case Connector.Type.EXTENSIONAL_IMAGE: return "/";
            case Connector.Type.LIST: return "#";
            default: return "";
        }
    }
    //FIXME:

    // isCommutative(): boolean {
    //     return [
    //         Connector.Type.CONJUNCTION,
    //         Connector.Type.DISJUNCTION,
    //         Connector.Type.PARALLEL_EVENTS,
    //         Connector.Type.INTENSIONAL_INTERSECTION,
    //         Connector.Type.EXTENSIONAL_INTERSECTION,
    //         Connector.Type.INTENSIONAL_SET,
    //         Connector.Type.EXTENSIONAL_SET
    //     ].includes(this.type_);
    // }

    isSingleOnly(): boolean {
        return this.type_ === Connector.Type.NEGATION;
    }

    isDoubleOnly(): boolean {
        return this.type_ === Connector.Type.EXTENSIONAL_DIFFERENCE || this.type_ === Connector.Type.INTENSIONAL_DIFFERENCE;
    }

    // isMultipleOnly(): boolean {
    //     return [
    //         Connector.Type.CONJUNCTION,
    //         Connector.Type.DISJUNCTION,
    //         Connector.Type.PARALLEL_EVENTS,
    //         Connector.Type.SEQUENTIAL_EVENTS,
    //         Connector.Type.INTENSIONAL_INTERSECTION,
    //         Connector.Type.EXTENSIONAL_INTERSECTION,
    //         Connector.Type.EXTENSIONAL_DIFFERENCE,
    //         Connector.Type.INTENSIONAL_DIFFERENCE,
    //         Connector.Type.INTENSIONAL_IMAGE,
    //         Connector.Type.EXTENSIONAL_IMAGE
    //     ].includes(this.type_);
    // }

    isTemporal(): boolean {
        return this.type_ === Connector.Type.SEQUENTIAL_EVENTS || this.type_ === Connector.Type.PARALLEL_EVENTS;
    }

    isPredictive(): boolean {
        return this.type_ === Connector.Type.SEQUENTIAL_EVENTS;
    }

    isConcurrent(): boolean {
        return this.type_ === Connector.Type.PARALLEL_EVENTS;
    }

    getAtemporal(): Connector {
        if (this.type_ === Connector.Type.SEQUENTIAL_EVENTS || this.type_ === Connector.Type.PARALLEL_EVENTS) {
            return new Connector(Connector.Type.CONJUNCTION);
        }
        return new Connector(this.type_);
    }

    getConcurrent(): Connector {
        if (this.type_ === Connector.Type.CONJUNCTION) {
            return new Connector(Connector.Type.PARALLEL_EVENTS);
        }
        return new Connector(this.type_);
    }

    getPredictive(): Connector {
        if (this.type_ === Connector.Type.CONJUNCTION) {
            return new Connector(Connector.Type.SEQUENTIAL_EVENTS);
        }
        return new Connector(this.type_);
    }

    // checkValid(lenTerms: number): boolean {
    //     if (this.isSingleOnly()) {
    //         return lenTerms === 1;
    //     } else if (this.isDoubleOnly()) {
    //         return lenTerms === 2;
    //     } else if (this.isMultipleOnly()) {
    //         return lenTerms > 1;
    //     } else {
    //         return lenTerms > 0;
    //     }
    // }
}

export { Connector };