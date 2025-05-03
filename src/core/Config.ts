

class Config {
    // Term complexity parameters
    static r_term_complexity_unit: number = 0.5;
    static t_sentence_directness_unit: number = 0.5;

    // Temporal parameters
    static temporal_duration: number = 5;
    //
    static budget_thresh: number = 0.01

    // Truth-value parameters
    static f: number = 1.0;  // frequency
    static c: number = 0.9;  // confidence
    static k: number = 1.0;  // horizon

    // Default budget values
    static priority: number = 0.8;    // Default task priority value
    static durability: number = 0.8;  // Default task durability value
    static quality: number = 0.5;     // Default task quality value

    // Budget parameters for different sentence types
    static p_judgement: number = 0.8;   // Priority for judgments
    static d_judgement: number = 0.5;   // Durability - how long judgments persist

    static p_question: number = 0.9;    // Priority for questions
    static d_question: number = 0.9;    // Durability - how long questions remain active

    static p_quest: number = 0.9;       // Priority for quests
    static d_quest: number = 0.9;       // Durability - persistence of desire queries

    static p_goal: number = 0.9;        // Priority for goals
    static d_goal: number = 0.9;        // Durability - how long goals remain active

    static c_judgement: number = 0.9;   // Default confidence for judgments
    static c_goal: number = 0.9;        // Default confidence for goals
}

export { Config };