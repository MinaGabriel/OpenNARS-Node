{
function makeTask(sentence, budget) {
  // Extract budget values with proper defaults
  const defaults = {
    '.': { // Judgment
      p: options.Parameters.DEFAULT_JUDGMENT_PRIORITY || 0.9,
      d: options.Parameters.DEFAULT_JUDGMENT_DURABILITY || 0.9,
      q: 1.0
    },
    '?': { // Question
      p: options.Parameters.DEFAULT_QUESTION_PRIORITY || 0.9,
      d: options.Parameters.DEFAULT_QUESTION_DURABILITY || 0.9,
      q: 1.0
    },
    '!': { // Goal
      p: 0.9,
      d: 0.9,
      q: 1.0
    }
  };

  // Get punctuation mark to determine defaults
  const punct = sentence.getPunctuation();
  const def = defaults[punct] || defaults['.'];

  // Use provided budget values or defaults
  const [priority, durability, quality] = budget || [];
  const p = priority ?? def.p;
  const d = durability ?? def.d;
  const q = quality ?? (sentence.getTruth() ? 
    options.BudgetFunctions.truthToQuality(sentence.getTruth()) : 
    def.q);

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
  = judgment
  / question
  / goal 

judgment = term:statement _ "." _ tense:tense? _ truth:truth? { return new options.Judgement(term, ".", truth, tense); }
question = term:statement _ "?" _ tense:tense? { return new options.Question(); } //TODO
goal     = term:statement _ "!" _ tense:tense? _ desire:desire? { return new options.Goal(); }  //TODO

statement
  = "<" _ subject:term _ copula:copula _ predicate:term _ ">" { return new options.Statement(subject, copula, predicate, options.TermType.STATEMENT); }
  / "(" _ subject:term _ copula:copula _ predicate:term _ ")" { return new options.Statement(subject, copula, predicate); }

budget = "$" priority:priority _ ";" _ durability:durability _ ";" _ quality:quality "$" { return [priority, durability, quality]; }

tense = ":/:" { return options.Tense.FUTURE; }
      / ":|:" { return options.Tense.Present; }
      / ":\\:" { return options.Tense.Past; }
      / ":-:" { return options.Tense.Eternal; }

truth = "%" frequency:frequency ";"? confidence_and_k_evidence:confidence_k_evidence_group? "%" {
  return new options.Truth(
    frequency,
    confidence_and_k_evidence ? confidence_and_k_evidence.confidence : null,
    confidence_and_k_evidence ? confidence_and_k_evidence.k_evidence : null
  );
}

confidence_k_evidence_group = confidence:confidence ";"? k_evidence:k_evidence? { return { confidence, k_evidence }; }

desire = "%" value:number (";" confidence:number)? "%" { return { type: "desire", value, confidence }; }

copula = value:"-->"  { return new options.Copula("Inheritance", value); }

       / value:"<->"  { return new options.Copula("Similarity", value); }
       / value:"{--"  { return new options.Copula("Instance", value); }
       / value:"--]"  { return new options.Copula("Property", value); }
       / value:"{-]"  { return new options.Copula("InstanceProperty", value); }
       / value:"==>"  { return new options.Copula("Implication", value); }
       / value:"=/>"  { return new options.Copula("PredictiveImplication", value); }
       / value:"=|>"  { return new options.Copula("ConcurrentImplication", value); }
       / value:"=\\"  { return new options.Copula("RetrospectiveImplication", value); }
       / value:"<=>"  { return new options.Copula("Equivalence", value); }
       / value:"</>"  { return new options.Copula("PredictiveEquivalence", value); }
       / value:"<|>"  { return new options.Copula("ConcurrentEquivalence", value); }

term = variable:variable { return variable; }
     / statement:statement { return statement; } // (* Example: <Bird --> Fly> - A statement used as a term *)
     / non_variable:atom { return non_variable; } // (* Example: Bird - An atomic constant term *)

variable = symbol:"?" _ name:word { return { type: "query_variable", symbol, name }; }
         / symbol:"#" _ name:word { return { type: "dependent_variable", symbol, name }; }
         / symbol:"$" _ name:word { return { type: "independent_variable", symbol, name }; }

atom = name:word { return new options.Term(name.trim(), options.TermType.ATOM); }

word = chars:[a-zA-Z_]+ { return chars.join("").trim(); }

/*********************
 * Numeric Values
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