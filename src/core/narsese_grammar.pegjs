/**
 * Narsese Grammar Definition
 * Build: npx pegjs ./narsese_grammar.pegjs
 */

{
  // Helper function to create a Task
  function makeTask(budget, sentence) {
    let [priority, durability, quality] = budget || [null, null, null];
    let p, d, q;

    if (!priority || !durability || !quality) {
      switch (sentence.punct) {
        case options.Punctuation.Judgement:
          p = priority || options.Config.p_judgement;
          d = durability || options.Config.d_judgement;
          q = quality || (sentence.truth ? options.Budget.quality_from_truth(sentence.truth) : 1.0);
          break;
        case options.Punctuation.Question:
          p = priority || options.Config.p_question;
          d = durability || options.Config.d_question;
          q = quality || 1.0;
          break;
        case options.Punctuation.Quest:
          p = priority || options.Config.p_quest;
          d = durability || options.Config.d_quest;
          q = quality || 1.0;
          break;
        case options.Punctuation.Goal:
          p = priority || options.Config.p_goal;
          d = durability || options.Config.d_goal;
          q = quality || (sentence.truth ? options.Budget.quality_from_truth(sentence.truth) : 1.0);
          break;
        default:
          throw new Error('Invalid punctuation type in sentence.');
      }
    } else {
      [p, d, q] = [priority, durability, quality];
    }

    return new options.Task(sentence, new options.Budget(p, d, q));
  }

  // Helper function to create a Judgment
  function makeJudgment(term, tense, truth) {
    if (!term) throw new Error('Term is required for judgment.');

    //TODO:Develop Tense Logic

    let frequency = options.Config.f;
    let confidence = options.Config.c_judgment;
    let k_evidence = options.Config.k;

    if (truth) {
      frequency = truth.frequency;
      confidence = truth.confidence || 1.0;
      k_evidence = truth.k_evidence || k_evidence;
    }

    const truthValue = truth || new options.Truth(frequency, confidence, k_evidence);
    if (term._rebuild_vars) term._rebuild_vars();


    return new options.Judgement(term, new options.Stamp(0), truth);
  }

  // Helper function to create an atomic term
  function makeAtomTerm(value) {
    return new options.Term({ word: value.trim() });
  }
}

/*********************
 * Grammar Rules
 *********************/

start = _ task:task _ EOF { return task; }

task = budget:budget? _ sentence:sentence { return makeTask(budget, sentence); }

sentence
  = judgment
  / question
  / goal
  / quest

judgment = term:statement _ "." _ tense:tense? _ truth:truth? { return makeJudgment(term, tense, truth); }
question = term:statement _ "?" _ tense:tense? { return new options.Sentence(term, "question", "?", tense); }
goal     = term:statement _ "!" _ tense:tense? _ desire:desire? { return new options.Sentence(term, "goal", "!", tense, desire); }
quest    = term:statement _ "@" _ tense:tense? { return new options.Sentence(term, "quest", "@", tense); }

statement
  = "<" _ subject:term _ copula:copula _ predicate:term _ ">" { return new options.Statement(subject, copula, predicate); }
  / "(" _ subject:term _ copula:copula _ predicate:term _ ")" { return new options.Statement(subject, copula, predicate); }

budget = "$" priority:priority _ ";" _ durability:durability _ ";" _ quality:quality "$" { return [priority, durability, quality]; }

tense = ":/:" { return options.Tense.Future; }
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
     / statement:statement { return statement; }
     / nonvar:atom { return nonvar; }

variable = symbol:"?" _ name:word { return { type: "query_variable", symbol, name }; }
         / symbol:"#" _ name:word { return { type: "dependent_variable", symbol, name }; }
         / symbol:"$" _ name:word { return { type: "independent_variable", symbol, name }; }

atom = name:word { return makeAtomTerm(name); }

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