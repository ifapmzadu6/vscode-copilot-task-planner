/**
 * Configuration constants for the Task Planner extension
 */

export const Config = {
    /** Timeout for subagent invocations (30 seconds) */
    SUBAGENT_TIMEOUT_MS: 30000,

    /** Maximum retry attempts for JSON parsing */
    MAX_JSON_PARSE_RETRIES: 3,

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
        /** Plan content max height in pixels */
        PLAN_MAX_HEIGHT: 400,
        /** Body padding in pixels */
        BODY_PADDING: 16,
        /** Default font size in pixels */
        FONT_SIZE: 13,
        /** Small font size in pixels */
        FONT_SIZE_SMALL: 12,
        /** Extra small font size in pixels */
        FONT_SIZE_XS: 11,
        /** Spinner size in pixels */
        SPINNER_SIZE: 14,
    },

    /** Logging prefix */
    LOG_PREFIX: '[TaskPlanner]',
} as const;

/**
 * Type for the Config object
 */
export type ConfigType = typeof Config;
