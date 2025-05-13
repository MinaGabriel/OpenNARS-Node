export class Symbols {
    /* sentence type and delimiters */
    public static readonly JUDGMENT_MARK = '.';
    public static readonly QUESTION_MARK = '?';

    /* variable type */
    public static readonly VAR_INDEPENDENT = '$';
    public static readonly VAR_DEPENDENT = '#';
    public static readonly VAR_QUERY = '?';

    /* numerical value delimiters */
    public static readonly BUDGET_VALUE_MARK = '$';
    public static readonly TRUTH_VALUE_MARK = '%';
    public static readonly VALUE_SEPARATOR = ';';

    /* CompoundTerm delimiters */
    public static readonly COMPOUND_TERM_OPENER = '(';
    public static readonly COMPOUND_TERM_CLOSER = ')';
    public static readonly STATEMENT_OPENER = '<';
    public static readonly STATEMENT_CLOSER = '>';
    public static readonly SET_EXT_OPENER = '{';
    public static readonly SET_EXT_CLOSER = '}';
    public static readonly SET_INT_OPENER = '[';
    public static readonly SET_INT_CLOSER = ']';

    /* special characters in argument list */
    public static readonly ARGUMENT_SEPARATOR = ',';
    public static readonly IMAGE_PLACE_HOLDER = '_';

    /* CompoundTerm operators */
    public static readonly INTERSECTION_EXT_OPERATOR = "&";
    public static readonly INTERSECTION_INT_OPERATOR = "|";
    public static readonly DIFFERENCE_EXT_OPERATOR = "-";
    public static readonly DIFFERENCE_INT_OPERATOR = "~";
    public static readonly PRODUCT_OPERATOR = "*";
    public static readonly IMAGE_EXT_OPERATOR = "/";
    public static readonly IMAGE_INT_OPERATOR = "\\";

    /* CompoundStatement operators */
    public static readonly NEGATION_OPERATOR = "--";
    public static readonly DISJUNCTION_OPERATOR = "||";
    public static readonly CONJUNCTION_OPERATOR = "&&";

    /* built-in relations */
    public static readonly INHERITANCE_RELATION = "-->";
    public static readonly SIMILARITY_RELATION = "<->";
    public static readonly INSTANCE_RELATION = "{--";
    public static readonly PROPERTY_RELATION = "--]";
    public static readonly INSTANCE_PROPERTY_RELATION = "{-]";
    public static readonly IMPLICATION_RELATION = "==>";
    public static readonly EQUIVALENCE_RELATION = "<=>";

    /* experience line prefix */
    public static readonly INPUT_LINE = "IN";
    public static readonly OUTPUT_LINE = "OUT";
    public static readonly PREFIX_MARK = ':';
    public static readonly RESET_MARK = '*';
    public static readonly COMMENT_MARK = '/';

    /* Stamp display only */
    public static readonly STAMP_OPENER = '{';
    public static readonly STAMP_CLOSER = '}';
    public static readonly STAMP_SEPARATOR = ';';
    public static readonly STAMP_STARTER = ':';

    /* TermLink type display only */
    public static readonly TO_COMPONENT_1 = " @(";
    public static readonly TO_COMPONENT_2 = ")_ ";
    public static readonly TO_COMPOUND_1 = " _@(";
    public static readonly TO_COMPOUND_2 = ") ";
}