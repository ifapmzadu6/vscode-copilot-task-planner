import { DomIds } from '../constants/ui';
import { generateHelperFunctions, generateMessageHandlers, generateEventListeners } from './webview';

/**
 * Generates the initialization code for webview elements
 */
function generateInitialization(): string {
    return `
        const vscode = acquireVsCodeApi();
        const qaHistory = document.getElementById('${DomIds.QA_HISTORY}');
        const currentQuestion = document.getElementById('${DomIds.CURRENT_QUESTION}');
        const qNum = document.getElementById('${DomIds.Q_NUM}');
        const qText = document.getElementById('${DomIds.Q_TEXT}');
        const inputArea = document.getElementById('${DomIds.INPUT_AREA}');
        const status = document.getElementById('${DomIds.STATUS}');
        const statusText = document.getElementById('${DomIds.STATUS_TEXT}');
        const submitBtn = document.getElementById('${DomIds.SUBMIT_BTN}');
        const backBtn = document.getElementById('${DomIds.BACK_BTN}');

        let currentQuestionData = null;

        // Show initial loading state
        status.style.display = 'block';
    `;
}

/**
 * Generates the complete JavaScript for the webview.
 * Combines initialization, helpers, message handlers, and event listeners.
 */
export function generateScript(): string {
    return [
        generateInitialization(),
        generateHelperFunctions(),
        generateMessageHandlers(),
        generateEventListeners()
    ].join('\n');
}
