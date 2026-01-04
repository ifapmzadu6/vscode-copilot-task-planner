/**
 * Type guards for message validation
 */

import { Question, QuestionResponse, WebviewMessage, WebviewIncomingMessage } from './messages';

/**
 * Checks if the value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/**
 * Validates a Question object
 */
export function isValidQuestion(q: unknown): q is Question {
    if (!isObject(q)) return false;
    if (typeof q.text !== 'string') return false;
    if (!['text', 'select', 'multiline'].includes(q.type as string)) return false;
    if (q.type === 'select' && !Array.isArray(q.options)) return false;
    if (q.options !== undefined && !Array.isArray(q.options)) return false;
    return true;
}

/**
 * Validates a QuestionResponse object
 */
export function isQuestionResponse(obj: unknown): obj is QuestionResponse {
    if (!isObject(obj)) return false;
    if (typeof obj.done !== 'boolean') return false;
    if (obj.question !== undefined && !isValidQuestion(obj.question)) return false;
    if (obj.reason !== undefined && typeof obj.reason !== 'string') return false;
    return true;
}

/**
 * Type guard for any webview message (validates basic structure)
 */
export function isWebviewMessage(msg: unknown): msg is WebviewIncomingMessage {
    if (!isObject(msg)) return false;
    if (typeof msg.type !== 'string') return false;
    return Object.values(WebviewMessage).includes(msg.type as (typeof WebviewMessage)[keyof typeof WebviewMessage]);
}

/**
 * Type guard for answer message
 */
export function isAnswerMessage(
    msg: WebviewIncomingMessage
): msg is { type: typeof WebviewMessage.ANSWER; answer: string } {
    return msg.type === WebviewMessage.ANSWER && 'answer' in msg && typeof msg.answer === 'string';
}

/**
 * Type guard for revise message
 */
export function isReviseMessage(
    msg: WebviewIncomingMessage
): msg is { type: typeof WebviewMessage.REVISE_PLAN; feedback: string } {
    return msg.type === WebviewMessage.REVISE_PLAN && 'feedback' in msg && typeof msg.feedback === 'string';
}

/**
 * Type guard for translate message
 */
export function isTranslateMessage(
    msg: WebviewIncomingMessage
): msg is { type: typeof WebviewMessage.TRANSLATE_PLAN; targetLang: string } {
    return msg.type === WebviewMessage.TRANSLATE_PLAN && 'targetLang' in msg && typeof msg.targetLang === 'string';
}
