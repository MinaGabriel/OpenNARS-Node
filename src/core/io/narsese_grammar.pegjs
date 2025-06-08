{ 
  function makeTask(sentence, budget) {
    console.log("Hello") ;
    // Extract budget symbols with proper defaults
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
    const punctuation = sentence.punctuation;
    const def = defaults[punctuation] || defaults['.'];

    // Use provided budget symbols or defaults
    const [priority, durability, quality] = budget || [];
    const p = priority ?? def.p;
    const d = durability ?? def.d;
    const q = quality ?? (sentence.truth ? options.BudgetFunctions.truthToQuality(sentence.truth) :  def.q);
    console.log(sentence) ;
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

judgment = term:(statement / compound) _ "." _ tense:tense? _ truth:truth? { return new options.Judgement(term, ".", truth, tense); }
question = term:(statement / compound) _ "?" _ tense:tense? { return new options.Question(); } //TODO
goal     = term:(statement / compound) _ "!" _ tense:tense? _ desire:desire? { return new options.Goal(); }  //TODO 
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
     / non_variable:non_variable { return non_variable; } // (* Example: Bird - An atomic constant term *)

variable = symbol:"?" _ name:word { return new options.Term(name, options.TermType.ATOM, symbol);  } // (* query variable in question *)
         / symbol:"#" _ name:word { return new options.Term(name, options.TermType.ATOM, symbol);  } // (* dependent variable *)
         / symbol:"$" _ name:word { return new options.Term(name, options.TermType.ATOM, symbol);  } // (* independent variable in question *)

non_variable = name:word { return new options.Term(name, options.TermType.ATOM); }
             / compound // term
             / statement 
 
word = chars:[a-zA-Z_]+ { return chars.join("").trim(); }

/*********************
 * Compound Terms
 * A compound term, e.g., "(&&, A, B)", "{A, B}", or "(--, A)". 
 *********************/

compound = set 

set = extensional_image
    / intensional_image

extensional_image = "(" _ "/" "," _ first:term rest:("," _ term)* _ ")" {
  // `rest` is always an array (possibly empty)
  const terms = [first, ...rest.map(item => item[2])];
  return new options.Compound(new options.Connector(options.ConnectorType.EXTENSIONAL_IMAGE), terms);
}

intensional_image = "(" _ "\\" "," _ first:term rest:("," _ term)* _ ")" {
  const terms = [first, ...rest.map(item => item[2])];
  return new options.Compound(new options.Connector(options.ConnectorType.INTENSIONAL_IMAGE), terms);
}
  
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
