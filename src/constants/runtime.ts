/**
 * Runtime configuration constants for the Task Planner extension.
 * Contains limits and other operational settings.
 */

export const RuntimeConfig = {
    /** Maximum retry attempts for JSON parsing */
    MAX_JSON_PARSE_RETRIES: 3,

    /** Minimum number of questions to ask during Q&A phase */
    MIN_QUESTIONS: 3,

    /** Maximum number of questions to ask during Q&A phase */
    MAX_QUESTIONS: 7,

    /** Tool names used for invocations */
    TOOL_NAMES: {
        SUBAGENT: 'runSubagent',
        MARATHON_PLANNER: 'marathonPlanner',
    },

    /** Default todo tool name */
    DEFAULT_TODO_TOOL_NAME: 'manage_todo_list',

    /** Subagent configuration */
    SUBAGENT: {
        /** Number of retry attempts on failure */
        DEFAULT_RETRIES: 3,
        /** Initial delay between retries in milliseconds */
        DEFAULT_RETRY_DELAY_MS: 1000,
    },

    /** Temp file configuration */
    TEMP_FILES: {
        /** Maximum age of temp files before cleanup (24 hours) */
        MAX_AGE_MS: 24 * 60 * 60 * 1000,
        /** Subdirectory name for temp files */
        SUBDIRECTORY: 'temp',
    },

    /** Logging configuration */
    LOGGING: {
        /** Prefix for log messages */
        PREFIX: '[TaskPlanner]',
    },
} as const;
