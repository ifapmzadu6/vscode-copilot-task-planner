/**
 * Configuration constants for the Task Planner extension
 */

export const Config = {
    /** Timeout for subagent invocations (30 seconds) */
    SUBAGENT_TIMEOUT_MS: 30000,

    /** Maximum retry attempts for JSON parsing */
    MAX_JSON_PARSE_RETRIES: 2,

    /** Maximum number of questions to ask */
    MAX_QUESTIONS: 5,

    /** Tool names used for invocations */
    TOOL_NAMES: {
        SUBAGENT: 'runSubagent',
        PLAN: 'plan',
    },

    /** UI-related constants */
    UI: {
        /** Webview panel identifier */
        PANEL_ID: 'taskPlanner',
        /** Webview panel title */
        PANEL_TITLE: 'Task Planner',
    },

    /** Logging prefix */
    LOG_PREFIX: '[TaskPlanner]',
} as const;

/**
 * Type for the Config object
 */
export type ConfigType = typeof Config;
