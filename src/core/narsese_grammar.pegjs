/*
  Mini-NARS Narsese grammar (book §4.1, Table 4.1).

  Build:  npx peggy --format commonjs -o src/core/narsese_grammar.js src/core/narsese_grammar.pegjs

  The parser returns a plain object (see narsese_grammar.d.ts); NarseseParser.ts
  turns it into a Task. The grammar knows nothing about the TypeScript classes.

  Accepted input:
    <robin --> bird>.                     judgment, default truth
    <robin --> bird>. %1.0;0.9%           judgment with truth
    <robin --> bird>. %0.8%               judgment, frequency only
    <robin --> animal>?                   question
    <robin --> ?x>?                       question with a query variable
    $0.8$ <robin --> bird>.               priority first (OpenNARS style)
    <robin --> bird>. %1.0;0.9% $0.8$     priority last (book §4.6 style)
*/

start
  = _ before:priority? _ sentence:sentence _ after:priority? _ EOF {
      if (before !== null && after !== null) error("Give the priority once, either before or after the sentence");
      return { ...sentence, priority: before ?? after };
    }

sentence
  = judgment
  / question

judgment
  = statement:statement _ "." _ truth:truth? {
      if (statement.subject.startsWith("?") || statement.predicate.startsWith("?")) {
        error("Variables are only allowed in questions");
      }
      return { kind: "judgment", ...statement, truth };
    }

question
  = statement:statement _ "?" {
      return { kind: "question", ...statement, truth: null };
    }

statement
  = "<" _ subject:term _ "-->" _ predicate:term _ ">" {
      if (subject === predicate) error(`A term can't be related to itself: <${subject} --> ${predicate}>`);
      if (subject.startsWith("?") && predicate.startsWith("?")) error("At most one variable per statement");
      return { subject, predicate };
    }

term
  = "?" name:word? { return "?" + (name ?? ""); }
  / word

word "word"
  = $([a-zA-Z0-9_]+ ("-" [a-zA-Z0-9_]+)*)   // hyphens only inside a word, so <a-->b> still parses

truth
  = "%" _ frequency:unit _ confidence:(";" _ c:unit _ { return c; })? "%" {
      if (confidence !== null && (confidence <= 0 || confidence >= 1)) {
        error("Confidence must be strictly between 0 and 1");
      }
      return { frequency, confidence };
    }

priority
  = "$" _ value:unit _ "$" {
      if (value <= 0) error("Priority must be greater than 0");
      return value;
    }

unit "number in [0, 1]"
  = text:$([0-9]* ("." [0-9]+)?) &{ return text.length > 0; } {
      const value = parseFloat(text);
      if (value > 1) error(`${text} is out of range [0, 1]`);
      return value;
    }

_ "whitespace"
  = [ \t\r\n]*

EOF "end of input"
  = !.
