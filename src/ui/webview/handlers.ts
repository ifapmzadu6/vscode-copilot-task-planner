/**
 * Generates message handlers for the webview script.
 * This file aggregates handlers from modular components.
 */

import {
    generateQuestionHandlers,
    generatePlanHandlers,
    generateQuestionEventListeners,
    generatePlanEventListeners,
} from './handlers/index';

/**
 * Generates all message handlers for the webview script
 */
export function generateMessageHandlers(): string {
    const questionHandlers = generateQuestionHandlers();
    const planHandlers = generatePlanHandlers();

    return `
        window.addEventListener('message', event => {
            const message = event.data;

            ${questionHandlers}
            ${planHandlers}
        });
    `;
}

/**
 * Generates all event listeners for UI interactions
 */
export function generateEventListeners(): string {
    const questionListeners = generateQuestionEventListeners();
    const planListeners = generatePlanEventListeners();

    return `
        ${questionListeners}
        ${planListeners}
    `;
}
