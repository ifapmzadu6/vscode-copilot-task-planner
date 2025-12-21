/**
 * Runtime configuration constants for the Task Planner extension.
 * Contains timeouts, limits, and other operational settings.
 */

export const RuntimeConfig = {
    /** Timeout for subagent invocations in milliseconds */
    SUBAGENT_TIMEOUT_MS: 30000,

    /** Maximum retry attempts for JSON parsing */
    MAX_JSON_PARSE_RETRIES: 3,

    /** Maximum number of questions to ask during Q&A phase */
    MAX_QUESTIONS: 5,

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

export type RuntimeConfigType = typeof RuntimeConfig;
