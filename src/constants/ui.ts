/**
 * UI-specific constants for the Task Planner extension.
 * Contains styling, dimensions, and display-related configuration.
 */

export const UIConfig = {
    /** Webview panel identifier */
    PANEL_ID: 'taskPlanner',
    /** Webview panel title */
    PANEL_TITLE: 'Task Planner',

    /** Dimensions */
    DIMENSIONS: {
        /** Plan content max height in pixels */
        PLAN_MAX_HEIGHT: 400,
        /** Body padding in pixels */
        BODY_PADDING: 16,
        /** Spinner size in pixels */
        SPINNER_SIZE: 14,
    },

    /** Font sizes */
    FONT: {
        /** Default font size in pixels */
        DEFAULT: 13,
        /** Small font size in pixels */
        SMALL: 12,
        /** Extra small font size in pixels */
        XS: 11,
    },
} as const;

export type UIConfigType = typeof UIConfig;
