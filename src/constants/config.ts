/**
 * Configuration constants for the Task Planner extension.
 * This file provides a unified configuration object for backwards compatibility.
 *
 * For new code, prefer importing from specific modules:
 * - './ui' for UI-related constants
 * - './runtime' for runtime configuration
 */

import { UIConfig } from './ui';
import { RuntimeConfig } from './runtime';

/**
 * Unified configuration object.
 * Combines UI and runtime configuration for backwards compatibility.
 */
export const Config = {
    /** Timeout for subagent invocations (30 seconds) */
    SUBAGENT_TIMEOUT_MS: RuntimeConfig.SUBAGENT_TIMEOUT_MS,

    /** Maximum retry attempts for JSON parsing */
    MAX_JSON_PARSE_RETRIES: RuntimeConfig.MAX_JSON_PARSE_RETRIES,

    /** Maximum number of questions to ask */
    MAX_QUESTIONS: RuntimeConfig.MAX_QUESTIONS,

    /** Tool names used for invocations */
    TOOL_NAMES: RuntimeConfig.TOOL_NAMES,

    /** UI-related constants */
    UI: {
        /** Webview panel identifier */
        PANEL_ID: UIConfig.PANEL_ID,
        /** Webview panel title */
        PANEL_TITLE: UIConfig.PANEL_TITLE,
        /** Plan content max height in pixels */
        PLAN_MAX_HEIGHT: UIConfig.DIMENSIONS.PLAN_MAX_HEIGHT,
        /** Body padding in pixels */
        BODY_PADDING: UIConfig.DIMENSIONS.BODY_PADDING,
        /** Default font size in pixels */
        FONT_SIZE: UIConfig.FONT.DEFAULT,
        /** Small font size in pixels */
        FONT_SIZE_SMALL: UIConfig.FONT.SMALL,
        /** Extra small font size in pixels */
        FONT_SIZE_XS: UIConfig.FONT.XS,
        /** Spinner size in pixels */
        SPINNER_SIZE: UIConfig.DIMENSIONS.SPINNER_SIZE,
    },

    /** Logging prefix */
    LOG_PREFIX: RuntimeConfig.LOGGING.PREFIX,
} as const;

/**
 * Type for the Config object
 */
export type ConfigType = typeof Config;

// Re-export modular configs for direct access
export { UIConfig } from './ui';
export { RuntimeConfig } from './runtime';
