/**
 * UI-specific constants for the Task Planner extension.
 * Contains styling, dimensions, and display-related configuration.
 */

/**
 * DOM element IDs used in the webview.
 * Centralizing these prevents typos and makes refactoring easier.
 */
export const DomIds = {
    // Q&A elements
    QA_HISTORY: 'qa-history',
    CURRENT_QUESTION: 'current-question',
    Q_NUM: 'q-num',
    Q_TEXT: 'q-text',
    INPUT_AREA: 'input-area',
    SUBMIT_BTN: 'submitBtn',
    BACK_BTN: 'backBtn',
    OTHER_TEXT: 'other-text',

    // Status elements
    STATUS: 'status',
    STATUS_TEXT: 'status-text',

    // Plan elements
    PLAN_PANEL: 'plan-panel',
    PLAN_CONTENT: 'plan-content',
    APPROVE_BTN: 'approveBtn',
    REVISE_BTN: 'reviseBtn',
    PLAN_CANCEL_BTN: 'planCancelBtn',

    // Feedback elements
    FEEDBACK_SECTION: 'feedback-section',
    FEEDBACK_TEXT: 'feedback-text',
    FEEDBACK_ERROR: 'feedback-error',
    FEEDBACK_CANCEL_BTN: 'feedbackCancelBtn',

    // Language elements
    LANG_TOGGLE: 'lang-toggle',
    LANG_SELECT: 'lang-select',
} as const;

/**
 * Status messages displayed in the webview.
 * Centralizing these makes i18n easier in the future.
 */
export const StatusMessages = {
    ANALYZING_WORKSPACE: 'Analyzing workspace...',
    THINKING_NEXT_QUESTION: 'Thinking of next question...',
    GENERATING_PLAN: 'Generating detailed plan...',
    TRANSLATING_PLAN: 'Translating plan...',
    REVISING_PLAN: 'Revising plan based on feedback...',
    ENTER_REVISION: 'Please enter your revision request.',
} as const;

/**
 * Button text labels.
 */
export const ButtonLabels = {
    REVISE_IDLE: '✎ Revise',
    REVISE_ACTIVE: '📤 Send Revision',
} as const;

export const UIConfig = {
    /** Webview panel identifier */
    PANEL_ID: 'taskPlanner',
    /** Webview panel title */
    PANEL_TITLE: 'Task Planner',

    /** Dimensions */
    DIMENSIONS: {
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
export type DomIdsType = typeof DomIds;
export type StatusMessagesType = typeof StatusMessages;
export type ButtonLabelsType = typeof ButtonLabels;
