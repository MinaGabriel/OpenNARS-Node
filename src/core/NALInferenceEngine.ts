// NALInferenceEngine.ts
// Small, functional Narsese/NAL rule engine (no classes).
// - Loads rules from YAML (NAL-1 + Immediate)
// - Stores facts in a Set<string>
// - Unifies and derives conclusions
// - Has a single-shot inference that applies rules once on the initial facts only
//
// Install deps:  npm i yaml

import YAML from "yaml";

/* -------------------------------------------------------------------------- */
/*                               Term Model                                   */
/* -------------------------------------------------------------------------- */

export type AtomTerm = { kind: "AtomTerm"; name: string };
export type VariableTerm = { kind: "VariableTerm"; name: string };
export type Copula = "-->" | "<->" | "==>";
export type StatementTerm = { kind: "StatementTerm"; copula: Copula; subject: Term; predicate: Term };
export type NegationTerm = { kind: "NegationTerm"; inner: Term };
export type Term = AtomTerm | VariableTerm | StatementTerm | NegationTerm;

export const createAtomTerm = (name: string): AtomTerm => ({ kind: "AtomTerm", name });
export const createVariableTerm = (name: string): VariableTerm => ({ kind: "VariableTerm", name });
export const createStatementTerm = (copula: Copula, subject: Term, predicate: Term): StatementTerm =>
    ({ kind: "StatementTerm", copula, subject, predicate });
export const createNegationTerm = (inner: Term): NegationTerm => ({ kind: "NegationTerm", inner });

const isVariableToken = (text: string) => /^[?$]?[A-Z][A-Za-z0-9_]*$/.test(text);

/* -------------------------------------------------------------------------- */
/*                               Narsese Parser                               */
/* -------------------------------------------------------------------------- */

export function parseTerm(source: string): Term {
    const trimmed = source.trim();

    // Statements: <... copula ...>
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
        const inner = trimmed.slice(1, -1).trim();
        const copulaMatch = inner.match(/(-->|<->|==>)/);
        if (!copulaMatch) throw new Error(`Unsupported statement: ${source}`);
        const copula = copulaMatch[0] as Copula;
        const [left, right] = inner.split(copula).map((x) => x.trim());
        return createStatementTerm(copula, parseTerm(left), parseTerm(right));
    }

    // Negation compound: (--, X)
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
        const inside = trimmed.slice(1, -1).trim();
        const matchNegation = inside.match(/^--\s*,\s*(.+)$/);
        if (matchNegation) return createNegationTerm(parseTerm(matchNegation[1].trim()));
        throw new Error(`Unsupported compound term: ${source}`);
    }

    // Atom or Variable
    return isVariableToken(trimmed) ? createVariableTerm(trimmed) : createAtomTerm(trimmed);
}

/* -------------------------------------------------------------------------- */
/*                              Pretty Printer                                */
/* -------------------------------------------------------------------------- */

export function formatTerm(term: Term): string {
    switch (term.kind) {
        case "AtomTerm":
        case "VariableTerm":
            return term.name;
        case "NegationTerm":
            return `(--, ${formatTerm(term.inner)})`;
        case "StatementTerm":
            return `<${formatTerm(term.subject)} ${term.copula} ${formatTerm(term.predicate)}>`;
    }
}

/* -------------------------------------------------------------------------- */
/*                                   Unifier                                  */
/* -------------------------------------------------------------------------- */

type SubstitutionMap = Map<string, Term>;

function dereference(term: Term, substitution: SubstitutionMap): Term {
    while (term.kind === "VariableTerm" && substitution.has(term.name)) term = substitution.get(term.name)!;
    return term;
}

function occurs(variable: VariableTerm, term: Term, substitution: SubstitutionMap): boolean {
    term = dereference(term, substitution);
    if (term.kind === "VariableTerm") return term.name === variable.name;
    if (term.kind === "StatementTerm")
        return occurs(variable, term.subject, substitution) || occurs(variable, term.predicate, substitution);
    if (term.kind === "NegationTerm")
        return occurs(variable, term.inner, substitution);
    return false;
}

function bind(variable: VariableTerm, term: Term, substitution: SubstitutionMap): SubstitutionMap | null {
    if (occurs(variable, term, substitution)) return null;
    const next = new Map(substitution);
    next.set(variable.name, term);
    return next;
}

export function unifyTerms(a: Term, b: Term, substitution: SubstitutionMap = new Map()): SubstitutionMap | null {
    a = dereference(a, substitution);
    b = dereference(b, substitution);

    if (a.kind === "VariableTerm") return bind(a, b, substitution);
    if (b.kind === "VariableTerm") return bind(b, a, substitution);

    if (a.kind === "AtomTerm" && b.kind === "AtomTerm") return a.name === b.name ? substitution : null;

    if (a.kind === "NegationTerm" && b.kind === "NegationTerm") {
        return unifyTerms(a.inner, b.inner, substitution);
    }

    if (a.kind === "StatementTerm" && b.kind === "StatementTerm") {
        if (a.copula !== b.copula) return null;
        const s1 = unifyTerms(a.subject, b.subject, substitution);
        if (!s1) return null;
        return unifyTerms(a.predicate, b.predicate, s1);
    }

    return null;
}

export function substitute(term: Term, substitution: SubstitutionMap): Term {
    term = dereference(term, substitution);
    if (term.kind === "StatementTerm") {
        return createStatementTerm(
            term.copula,
            substitute(term.subject, substitution),
            substitute(term.predicate, substitution)
        );
    }
    if (term.kind === "NegationTerm") {
        return createNegationTerm(substitute(term.inner, substitution));
    }
    return term;
}

/* -------------------------------------------------------------------------- */
/*                           Guard / Policy helpers                           */
/* -------------------------------------------------------------------------- */

function isNegation(term: Term): term is NegationTerm { return term.kind === "NegationTerm"; }
function isStatement(term: Term): term is StatementTerm { return term.kind === "StatementTerm"; }

function negationDepth(term: Term): number {
    return isNegation(term) ? 1 + negationDepth(term.inner) : 0;
}

function isReflexiveInheritance(term: Term): boolean {
    return (
        isStatement(term) &&
        term.copula === "-->" &&
        formatTerm(term.subject) === formatTerm(term.predicate)
    );
}

/* -------------------------------------------------------------------------- */
/*                                   Rules                                    */
/* -------------------------------------------------------------------------- */

type InferenceType =
    | "deduction" | "induction" | "abduction" | "exemplification"
    | "negative" | "conversion" | "contraposition"
    | string;

type BaseRule = {
    ruleName: string;
    isInverseVariant: boolean;
    conclusionTemplate: Term;
};

type TwoPremiseRule = BaseRule & {
    arity: 2;
    premisePatternOne: Term;
    premisePatternTwo: Term;
};

type OnePremiseRule = BaseRule & {
    arity: 1;
    premisePattern: Term;
};

type InferenceRule = OnePremiseRule | TwoPremiseRule;

function parseRuleLine(line: string): InferenceRule | null {
    const raw = line.trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("'")) return null;

    // Two-premise: {P1. P2} |- C .name'
    const matchTwoPremise = raw.match(/^\{(.+)\}\s*\|-\s*(.+)\s*\.(\w+)(\'?)$/);
    if (matchTwoPremise) {
        const [, premisesBlock, conclusionStr, name, prime] = matchTwoPremise;
        const [premOneStr, premTwoStr] = premisesBlock.split(".").map((s) => s.trim());
        return {
            arity: 2,
            ruleName: name as InferenceType,
            isInverseVariant: prime === "'",
            premisePatternOne: parseTerm(premOneStr),
            premisePatternTwo: parseTerm(premTwoStr),
            conclusionTemplate: parseTerm(conclusionStr.trim()),
        };
    }

    // One-premise: P |- C .name'
    const matchOnePremise = raw.match(/^(.+?)\s*\|-\s*(.+)\s*\.(\w+)(\'?)$/);
    if (matchOnePremise) {
        const [, prem, conc, name, prime] = matchOnePremise;
        return {
            arity: 1,
            ruleName: name as InferenceType,
            isInverseVariant: prime === "'",
            premisePattern: parseTerm(prem.trim()),
            conclusionTemplate: parseTerm(conc.trim()),
        };
    }

    throw new Error(`Bad rule line: ${line}`);
}

/* -------------------------------------------------------------------------- */
/*                                Engine State                                */
/* -------------------------------------------------------------------------- */

export type EngineState = {
    rules: InferenceRule[];
    knowledgeBaseStore: Set<string>;
};

export function createEngineState(): EngineState {
    return {
        rules: [],
        knowledgeBaseStore: new Set<string>(),
    };
}

/* ------------------------------ Rule Loading ------------------------------- */

export function loadYamlRules(
    state: EngineState,
    yamlText: string,
    pathKeys: string[] = ["rules", "nal1"]
): void {
    const documentObject = YAML.parse(yamlText);
    let cursor: any = documentObject;
    for (const key of pathKeys) cursor = cursor?.[key];
    const block = String(cursor || "");
    if (!block) throw new Error("No rules block found at the given YAML path.");

    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map(parseRuleLine).filter((r): r is InferenceRule => !!r);
    state.rules.push(...parsed);
}

/* --------------------------- Knowledge Base I/O ---------------------------- */

export function assertFact(state: EngineState, narsese: string): void {
    const cleaned = narsese.trim().replace(/\.$/, "");
    const term = parseTerm(cleaned);

    // Guard: skip trivial reflexive inheritance
    if (isReflexiveInheritance(term)) return;

    const key = formatTerm(term);
    state.knowledgeBaseStore.add(key);
}

export function listFacts(state: EngineState): string[] {
    return Array.from(state.knowledgeBaseStore);
}

function parseAllFacts(state: EngineState): Term[] {
    return Array.from(state.knowledgeBaseStore).map((k) => parseTerm(k));
}

function knowledgeBaseHas(state: EngineState, term: Term): boolean {
    return state.knowledgeBaseStore.has(formatTerm(term));
}

function knowledgeBaseAdd(state: EngineState, term: Term): boolean {
    if (isReflexiveInheritance(term)) return false;
    const key = formatTerm(term);
    if (state.knowledgeBaseStore.has(key)) return false;
    state.knowledgeBaseStore.add(key);
    return true;
}

/* ------------------------------ Inference API ------------------------------ */

export type InferenceExplanation = {
    conclusion: Term;
    ruleApplied: string;
    premisesMatched: Term[];      // 1 or 2
    substitutionUsed: Record<string, string>;
};

/**
 * Single-shot inference:
 * Apply each rule at most once per original fact (or fact pair) only.
 * Derived conclusions are NOT reused as premises during this call.
 */
export function inferSingleShotOnCurrentFacts(
    state: EngineState,
    options?: { allowOnePremise?: boolean; allowTwoPremise?: boolean }
): InferenceExplanation[] {
    const allowOnePremise = options?.allowOnePremise ?? true;
    const allowTwoPremise = options?.allowTwoPremise ?? true;

    const premiseSnapshot = parseAllFacts(state); // freeze premises
    const explanations: InferenceExplanation[] = [];
    const firedSignatureSet = new Set<string>();

    for (const rule of state.rules) {
        if (rule.arity === 2) {
            if (!allowTwoPremise) continue;

            for (let i = 0; i < premiseSnapshot.length; i++) {
                for (let j = 0; j < premiseSnapshot.length; j++) {
                    if (i === j) continue;
                    const factOne = premiseSnapshot[i];
                    const factTwo = premiseSnapshot[j];

                    const signature = `2|${rule.ruleName}${rule.isInverseVariant ? "'" : ""}|${formatTerm(factOne)}|${formatTerm(factTwo)}`;
                    if (firedSignatureSet.has(signature)) continue;

                    let substitution = unifyTerms(rule.premisePatternOne, factOne);
                    substitution = substitution && unifyTerms(rule.premisePatternTwo, factTwo, substitution);
                    if (!substitution) continue;

                    const conclusion = substitute(rule.conclusionTemplate, substitution);
                    if (isReflexiveInheritance(conclusion)) { firedSignatureSet.add(signature); continue; }

                    if (!knowledgeBaseHas(state, conclusion)) {
                        knowledgeBaseAdd(state, conclusion);
                        explanations.push({
                            conclusion,
                            ruleApplied: rule.ruleName + (rule.isInverseVariant ? " (prime)" : ""),
                            premisesMatched: [factOne, factTwo],
                            substitutionUsed: Object.fromEntries(
                                Array.from(substitution.entries()).map(([k, v]) => [k, formatTerm(v)])
                            ),
                        });
                    }
                    firedSignatureSet.add(signature);
                }
            }
        } else {
            if (!allowOnePremise) continue;

            for (const fact of premiseSnapshot) {
                const signature = `1|${rule.ruleName}${rule.isInverseVariant ? "'" : ""}|${formatTerm(fact)}`;
                if (firedSignatureSet.has(signature)) continue;

                const substitution = unifyTerms(rule.premisePattern, fact);
                if (!substitution) continue;

                // Guardrails for immediate rules
                if (rule.ruleName === "negative" && isNegation(fact)) {
                    firedSignatureSet.add(signature);
                    continue; // do not negate a negation
                }

                const conclusion = substitute(rule.conclusionTemplate, substitution);
                if (isNegation(conclusion) && negationDepth(conclusion) > 1) { firedSignatureSet.add(signature); continue; }
                if (isReflexiveInheritance(conclusion)) { firedSignatureSet.add(signature); continue; }

                if (!knowledgeBaseHas(state, conclusion)) {
                    knowledgeBaseAdd(state, conclusion);
                    explanations.push({
                        conclusion,
                        ruleApplied: rule.ruleName + (rule.isInverseVariant ? " (prime)" : ""),
                        premisesMatched: [fact],
                        substitutionUsed: Object.fromEntries(
                            Array.from(substitution.entries()).map(([k, v]) => [k, formatTerm(v)])
                        ),
                    });
                }
                firedSignatureSet.add(signature);
            }
        }
    }

    return explanations;
}
