{
    /**
     * Constructs a task object with an optional budget and a sentence.
     * @param {Object|null} budget - The budget object, or null if absent.
     * @param {Object} sentence - The parsed sentence object.
     * @returns {Object} A task object containing the budget and sentence.
     */
    function makeTask(budget, sentence) {
      return { budget, sentence };
    }
  
    /**
     * Constructs a term object for atomic terms.
     * @param {string} value - The term's string value.
     * @returns {Object} A term object with type "atom".
     */
    function makeAtomTerm(value) {
      return { type: "atom", value };
    }
  }
  
  /** Entry point of the grammar. */
  start
    = _ task:task _ EOF { return task; }
  
  /** A task consists of an optional budget followed by a sentence. */
  task
    = budget:budget? _ sentence:sentence { return makeTask(budget, sentence); }
  
  /** A sentence can be a judgment, question, goal, or quest. */
  sentence
    = judgment
    / question
    / goal
    / quest
  
  /** A judgment sentence, e.g., "<Bird --> Animal>. %0.8;0.7%". */
  judgment
    = content:statement_content _ "." _ tense:tense? _ truth:truth? {
        return {
          content,
          type: "judgment",
          tense,
          value: truth
        };
      }
  
  /** A question sentence, e.g., "<Bird --> Animal>?". */
  question
    = content:statement_content _ "?" _ tense:tense? {
        return {
          content,
          type: "question",
          tense
        };
      }
  
  /** A goal sentence, e.g., "<Bird --> Animal>! %0.8;0.7%". */
  goal
    = content:statement_content _ "!" _ tense:tense? _ desire:desire? {
        return {
          content,
          type: "goal",
          tense,
          value: desire
        };
      }
  
  /** A quest sentence, e.g., "<Bird --> Animal>@". */
  quest
    = content:statement_content _ "@" _ tense:tense? {
        return {
          content,
          type: "quest",
          tense
        };
      }
  
  /** A statement content, e.g., "<Bird --> Animal>", or a compound term. */
  statement_content
    = compound_term
    / statement
    / operation
  
  /** A statement, e.g., "<Bird --> Animal>" or "(Bird --> Animal)". */
  statement
    = "<" _ subject:term _ copula:copula _ predicate:term _ ">" {
        return {
          subject,
          copula,
          predicate
        };
      }
    / "(" _ subject:term _ copula:copula _ predicate:term _ ")" {
        return {
          subject,
          copula,
          predicate
        };
      }
  
  /** An operation, e.g., "^move(Robot, north)" or "(^move, Robot, north)". */
  operation
    = name:word _ "(" _ first:term ( "," _ rest:term )* _ ")" {
        const args = [first].concat(rest.map(item => item[2]));
        return { type: "operation", name, args };
      }
    / "(" _ op:op _ "," _ first:term ( "," _ rest:term )* _ ")" {
        const args = [first].concat(rest.map(item => item[2]));
        return { type: "operation", name: op.value, args };
      }
  
  /** An operator for operations, e.g., "^move". */
  op
    = "^" name:word { return { type: "op", value: name }; }
  
  /** A budget, e.g., "$0.5;0.3;0.7$". */
  budget
    = "$" priority:number _ ";" _ durability:number _ ";" _ quality:number "$" {
        return {
          priority,
          durability,
          quality
        };
      }
  
  /** Tense markers for temporal information. */
  tense
    = ":/:" { return "future"; }
    / ":|:" { return "present"; }
    / ":\\:" { return "past"; }
    / ":!" time:number ":" { return { type: "time", value: time }; }
  
  /** A truth value, e.g., "%0.8;0.7%". */
  truth
    = "%" frequency:number ( ";" confidence:number ( ";" k_evidence:number )? )? "%" {
        return {
          type: "truth",
          frequency,
          confidence: confidence || 0.9,
          k_evidence: k_evidence || 1
        };
      }
  
  /** A desire value, e.g., "%0.8;0.7%". */
  desire
    = "%" value:number ( ";" confidence:number ( ";" k_evidence:number )? )? "%" {
        return {
          type: "desire",
          value,
          confidence: confidence || 0.9,
          k_evidence: k_evidence || 1
        };
      }
  
  /** A number, e.g., "0.8" or "1". */
  number
    = n:[0-9]+ ("." d:[0-9]+)? { return parseFloat(text()); }
  
  /** A copula defining the relationship between subject and predicate. */
  copula
    = sym:"-->" { return { type: "inheritance", symbol: sym }; }
    / sym:"<->" { return { type: "similarity", symbol: sym }; }
    / sym:"{--" { return { type: "instance", symbol: sym }; }
    / sym:"--]" { return { type: "property", symbol: sym }; }
    / sym:"{-]" { return { type: "instance_property", symbol: sym }; }
    / sym:"==>" { return { type: "implication", symbol: sym }; }
    / sym:"=|>" { return { type: "concurrent_implication", symbol: sym }; }
    / sym:"=>\\" { return { type: "retrospective_implication", symbol: sym }; }
    / sym:"<=>" { return { type: "equivalence", symbol: sym }; }
    / sym:"</>" { return { type: "predictive_equivalence", symbol: sym }; }
    / sym:"<|>" { return { type: "concurrent_equivalence", symbol: sym }; }
    / sym:"=/>" { return { type: "predictive_implication", symbol: sym }; }
  
  /** A term, supporting variables, atomic terms, compound terms, statements, or operations. */
  term
    = variable
    / non_variable
  
  /** A variable term, e.g., "$x", "#y", "?z". */
  variable
    = sym:"$" _ name:word { return { type: "variable", kind: "independent", value: name, symbol: sym }; }
    / sym:"#" _ name:word { return { type: "variable", kind: "dependent", value: name, symbol: sym }; }
    / sym:"?" _ name:word { return { type: "variable", kind: "query", value: name, symbol: sym }; }
  
  /** A non-variable term, e.g., atomic term, compound term, statement, operation, or interval. */
  non_variable
    = interval
    / word:word { return makeAtomTerm(word); }
    / compound_term
    / statement
    / operation
  
  /** An interval term, e.g., "+5". */
  interval
    = "+" value:number { return { type: "interval", value }; }
  
  /** A compound term, e.g., "(&&, A, B)", "{A, B}", or "(--, A)". */
  compound_term
    = set
    / multi
    / single
    / ext_image
    / int_image
    / negation
  
  /** An extensional or intensional set. */
  set
    = ext_set
    / int_set
  
  /** Extensional set, e.g., "{Robin, Sparrow}". */
  ext_set
    = "{" _ first:term ( "," _ rest:term )* _ "}" {
        const elements = [first].concat(rest.map(item => item[2]));
        return { type: "set", kind: "extensional", elements };
      }
  
  /** Intensional set, e.g., "[Fly, Sing]". */
  int_set
    = "[" _ first:term ( "," _ rest:term )* _ "]" {
        const elements = [first].concat(rest.map(item => item[2]));
        return { type: "set", kind: "intensional", elements };
      }
  
  /** Multi-term connector, e.g., "(&&, A, B, C)". */
  multi
    = "(" _ connector:multi_connector "," _ first:term ( "," _ rest:term )+ _ ")" {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: connector, terms };
      }
    / "(" _ first:term ( "," _ rest:term )+ _ ")" {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "product", terms };
      }
    / "(" _ expr:multi_infix_expr _ ")" {
        return expr;
      }
  
  /** Multi-term connectors like && or &. */
  multi_connector
    = "&&" { return "conjunction"; }
    / "||" { return "disjunction"; }
    / "&|" { return "parallel_events"; }
    / "&/" { return "sequential_events"; }
    / "|" { return "intensional_intersection"; }
    / "&" { return "extensional_intersection"; }
    / "*" { return "product"; }
  
  /** Single-term connector, e.g., "(-, A, B)". */
  single
    = "(" _ connector:single_connector "," _ left:term "," _ right:term _ ")" {
        return { type: "compound_term", operator: connector, terms: [left, right] };
      }
    / "(" _ left:term _ connector:single_connector _ right:term _ ")" {
        return { type: "compound_term", operator: connector, terms: [left, right] };
      }
  
  /** Single-term connectors like - or ~. */
  single_connector
    = "-" { return "extensional_difference"; }
    / "~" { return "intensional_difference"; }
  
  /** Extensional image, e.g., "(/, A, _, B)". */
  ext_image
    = "(" _ "/" "," _ first:term ( "," _ rest:term )* _ ")" {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "extensional_image", terms };
      }
  
  /** Intensional image, e.g., "(\, A, _, B)". */
  int_image
    = "(" _ "\\" "," _ first:term ( "," _ rest:term )* _ ")" {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "intensional_image", terms };
      }
  
  /** Negation, e.g., "(--, A)". */
  negation
    = "(" _ "--" "," _ term:term _ ")" {
        return { type: "negation", term };
      }
    / "--" term:term {
        return { type: "negation", term };
      }
  
  /** Multi-term infix expressions with operator precedence. */
  multi_infix_expr
    = expr:multi_extint_expr { return expr; }
  
  /** Extensional intersection (&) - highest precedence. */
  multi_extint_expr
    = first:multi_intint_expr ( _ "&" _ rest:multi_intint_expr )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "extensional_intersection", terms };
      }
    / multi_intint_expr
  
  /** Intensional intersection (|). */
  multi_intint_expr
    = first:multi_parallel_expr ( _ "|" _ rest:multi_parallel_expr )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "intensional_intersection", terms };
      }
    / multi_parallel_expr
  
  /** Parallel events (&|). */
  multi_parallel_expr
    = first:multi_sequential_expr ( _ "&|" _ rest:multi_sequential_expr )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "parallel_events", terms };
      }
    / multi_sequential_expr
  
  /** Sequential events (&/). */
  multi_sequential_expr
    = first:multi_conj_expr ( _ "&/" _ rest:multi_conj_expr )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "sequential_events", terms };
      }
    / multi_conj_expr
  
  /** Conjunction (&&). */
  multi_conj_expr
    = first:multi_disj_expr ( _ "&&" _ rest:multi_disj_expr )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "conjunction", terms };
      }
    / multi_disj_expr
  
  /** Disjunction (||). */
  multi_disj_expr
    = first:multi_prod_expr ( _ "||" _ rest:multi_prod_expr )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "disjunction", terms };
      }
    / multi_prod_expr
  
  /** Product (*) - lowest precedence in infix. */
  multi_prod_expr
    = first:term ( _ "*" _ rest:term )+ {
        const terms = [first].concat(rest.map(item => item[2]));
        return { type: "compound_term", operator: "product", terms };
      }
    / term
  
  /** A word, consisting of allowed characters or a quoted string. */
  word
    = string
    / string_raw
  
  /** A quoted string, e.g., "\"Tweety Bird\"". */
  string
    = "\"" chars:[^\"]* "\"" { return chars.join(""); }
  
  /** A raw string of characters excluding reserved symbols. */
  string_raw
    = chars:[^\-+<>=&|!.?@~%;:/\\*#$\[\]\{\}\(\)]+ { return chars.join(""); }
  
  /** Whitespace, including spaces, tabs, and newlines. */
  _ "whitespace"
    = [ \t\n\r]* { return null; }
  
  /** End of input marker. */
  EOF "end of input"
    = !.