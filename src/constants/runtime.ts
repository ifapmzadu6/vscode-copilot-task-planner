/**
 * Runtime configuration constants for the Task Planner extension.
 * Contains limits and other operational settings.
 */

export const RuntimeConfig = {
    /** Maximum retry attempts for JSON parsing */
    MAX_JSON_PARSE_RETRIES: 3,

    /** Minimum number of questions to ask during Q&A phase */
    MIN_QUESTIONS: 1,

    /** Maximum number of questions to ask during Q&A phase */
    MAX_QUESTIONS: 7,

    /** Tool names used for invocations */
    TOOL_NAMES: {
        SUBAGENT: 'runSubagent',
        PLAN: 'plan',
    },

    /** Logging configuration */
    LOGGING: {
        /** Prefix for log messages */
        PREFIX: '[TaskPlanner]',
    },
} as const;
