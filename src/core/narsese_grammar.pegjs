/*
cd ./src/core/ && npx peggy -o narsese_grammar.js narsese_grammar.pegjs && cd ../../
*/

{
  function makeTask(sentence, budget) { 
    const defaults = {
      '.': { p: options.Parameters.DEFAULT_JUDGMENT_PRIORITY, d: options.Parameters.DEFAULT_JUDGMENT_DURABILITY, q: 0.95 },
      '?': { p: options.Parameters.DEFAULT_QUESTION_PRIORITY || 0.9, d: options.Parameters.DEFAULT_QUESTION_DURABILITY || 0.9, q: 1.0 },
      '!': { p: 0.9, d: 0.9, q: 1.0 }
    };
    const punctuation = sentence.punctuation;
    const def = defaults[punctuation] || defaults['.'];
    const [priority, durability, quality] = budget || [];
    const p = priority ?? def.p;
    const d = durability ?? def.d;
    const q = quality ?? (sentence.truth ? options.TruthFunctions.truthToQuality(sentence.truth) : def.q); 
    return new options.Task(
      sentence, 
      new options.Budget(null, p, d, q)
    );
  }
}

/*********************
 * Grammar Rules
 *********************/

start = _ task:task _ EOF { return task; }

task = budget:budget? _ sentence:sentence { return makeTask(sentence, budget); }

sentence
  = judgement
  / question
  / goal 

judgement = term:(statement / compound_term) _ "." _ tense:tense? _ truth:truth? { return new options.Judgement(term, ".", truth, tense); }
question  = term:(statement / compound_term) _ "?" _ tense:tense? { return new options.Question(term, tense); }
goal      = term:(statement / compound_term) _ "!" _ tense:tense? _ desire:desire? { return new options.Goal(); } 

statement
  = "<" _ subject:term _ copula:copula _ predicate:term _ ">" { return new options.Statement(subject, copula, predicate, options.TermType.STATEMENT); }
  / "(" _ subject:term _ copula:copula _ predicate:term _ ")" { return new options.Statement(subject, copula, predicate); }

budget = "$" priority:priority _ ";" _ durability:durability _ ";" _ quality:quality "$" { return [priority, durability, quality]; }

tense = ":/:" { return options.Tense.FUTURE; }
      / ":|:" { return options.Tense.PRESENT; }
      / ":\\:" { return options.Tense.PAST; }
      / ":-:"  { return options.Tense.ETERNAL; }

truth = "%" frequency:frequency ";"? confidence_and_k_evidence:confidence_k_evidence_group? "%" {
  return new options.Truth(
    frequency,
    confidence_and_k_evidence ? confidence_and_k_evidence.confidence : null,
    confidence_and_k_evidence ? confidence_and_k_evidence.k_evidence : null
  );
}

confidence_k_evidence_group = confidence:confidence ";"? k_evidence:k_evidence? { return { confidence, k_evidence }; }

desire = "%" symbol:number (";" confidence:number)? "%" { return { type: "desire", symbol, confidence }; }

copula = symbol:"-->"  { return new options.Copula(symbol); }
       / symbol:"<->"  { return new options.Copula(symbol); }
       / symbol:"{--"  { return new options.Copula(symbol); }
       / symbol:"--]"  { return new options.Copula(symbol); }
       / symbol:"{-]"  { return new options.Copula(symbol); }
       / symbol:"==>"  { return new options.Copula(symbol); }
       / symbol:"=/>"  { return new options.Copula(symbol); }
       / symbol:"=|>"  { return new options.Copula(symbol); }
       / symbol:"=\\"  { return new options.Copula(symbol); }
       / symbol:"<=>"  { return new options.Copula(symbol); }
       / symbol:"</>"  { return new options.Copula(symbol); }
       / symbol:"<|>"  { return new options.Copula(symbol); }

term = variable:variable { return variable; }
     / non_variable:non_variable { return non_variable; }

variable = symbol:"?" _ name:word { return new options.Term(symbol + name, options.TermType.ATOM, symbol); }
         / symbol:"#" _ name:word { return new options.Term(symbol + name, options.TermType.ATOM, symbol); }
         / symbol:"$" _ name:word { return new options.Term(symbol + name, options.TermType.ATOM, symbol); }

non_variable = name:word { return new options.Term(name, options.TermType.ATOM); }
             / compound_term
             / statement 
 
word = chars:[a-zA-Z_]+ { return chars.join("").trim(); }

/*********************
 * Compound Terms
 * Examples: 
 *   Negation: (--, Bird)
 *********************/

compound_term
  =   negation

/* Negation */
negation =  "(" _ "--" _ "," _ inner:term _ ")" { return new options.Compound(new options.Connector(options.ConnectorType.NEGATION), [inner]); } 

/*********************
 * Numbers
 *********************/

number      = n:[0-9]+ ("." d:[0-9]+)? { return parseFloat(text()); }
confidence  = [0]? "." [0]* [1-9] [0-9]* { return parseFloat(text()); }
           / "1" "." "0"* { return 1.0; }
           / "1" { return 1.0; }
priority    = [0]? "." [0-9]+ { return parseFloat(text()); }
           / "1" "." "0"* { return 1.0; }
           / "1" { return 1.0; }
           / "0" { return 0.0; }
durability  = [0]? "." [0]* [1-9] [0-9]* { return parseFloat(text()); }
           / "1" "." "0"* { return 1.0; }
           / "1" { return 1.0; }
quality     = [0]? "." [0-9]+ { return parseFloat(text()); }
           / "1" "." "0"* { return 1.0; }
           / "1" { return 1.0; }
           / "0" { return 0.0; }
frequency   = [0]? "." [0-9]+ { return parseFloat(text()); }
           / "1" "." "0"* { return 1.0; }
           / "1" { return 1.0; }
k_evidence  = [1-9] [0-9]* { return parseInt(text(), 10); }

_ "whitespace" = [ \t\n\r]* { return null; }
EOF "end of input" = !.
