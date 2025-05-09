class Symbols {
    static readonly JUDGMENT_MARK = '.';
    static readonly QUESTION_MARK = '?';
    static readonly GOAL_MARK = '!';

    static readonly BUDGET_VALUE_MARK = '$';
    static readonly TRUTH_VALUE_MARK = '%';
    static readonly VALUE_SEPARATOR = ';';

    static readonly VARIABLE_TAG = '#';
    static readonly QUERY_VARIABLE_TAG = '?';
    static readonly OPERATOR_TAG = '^';

    static readonly COMPOUND_TERM_OPENER = '(';
    static readonly COMPOUND_TERM_CLOSER = ')';
    static readonly STATEMENT_OPENER = '<';
    static readonly STATEMENT_CLOSER = '>';
    static readonly SET_EXT_OPENER = '{';
    static readonly SET_EXT_CLOSER = '}';
    static readonly SET_INT_OPENER = '[';
    static readonly SET_INT_CLOSER = ']';

    static readonly ARGUMENT_SEPARATOR = ',';
    static readonly IMAGE_PLACE_HOLDER = '_';

    static readonly INTERSECTION_EXT_OPERATOR = '&';
    static readonly INTERSECTION_INT_OPERATOR = '|';
    static readonly DIFFERENCE_EXT_OPERATOR = '-';
    static readonly DIFFERENCE_INT_OPERATOR = '~';
    static readonly PRODUCT_OPERATOR = '*';
    static readonly IMAGE_EXT_OPERATOR = '/';
    static readonly IMAGE_INT_OPERATOR = '\\';

    static readonly NEGATION_OPERATOR = '--';
    static readonly DISJUNCTION_OPERATOR = '||';
    static readonly CONJUNCTION_OPERATOR = '&&';
    static readonly SEQUENCE_OPERATOR = '&/';
    static readonly PARALLEL_OPERATOR = '&|';
    static readonly FUTURE_OPERATOR = '/>';
    static readonly PRESENT_OPERATOR = '|>';
    static readonly PAST_OPERATOR = '\\>';

    static readonly INHERITANCE_RELATION = '-->';
    static readonly SIMILARITY_RELATION = '<->';
    static readonly INSTANCE_RELATION = '{--';
    static readonly PROPERTY_RELATION = '--]';
    static readonly INSTANCE_PROPERTY_RELATION = '{-]';
    static readonly IMPLICATION_RELATION = '==>';
    static readonly EQUIVALENCE_RELATION = '<=>';
    static readonly IMPLICATION_AFTER_RELATION = '=/>';
    static readonly IMPLICATION_BEFORE_RELATION = '=\\>';
    static readonly IMPLICATION_WHEN_RELATION = '=|>';
    static readonly EQUIVALENCE_AFTER_RELATION = '</>';
    static readonly EQUIVALENCE_WHEN_RELATION = '<|>';

    static readonly Base_opener = ' {';
    static readonly Base_closer = '} ';
    static readonly Base_separator = ';';
    static readonly Base_separator0 = ': ';

    static readonly LinkToComponent_at1 = ' @(';
    static readonly LinkToComponent_at2 = ') _ ';
    static readonly LinkToCompound_at1 = ' _ @(';
    static readonly LinkToCompound_at2 = ') ';
}

export {Symbols}