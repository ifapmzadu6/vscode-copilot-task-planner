import { generateHelperFunctions, generateMessageHandlers, generateEventListeners } from './webview';

/**
 * Generates the initialization code for webview elements
 */
function generateInitialization(): string {
    return `
        const vscode = acquireVsCodeApi();
        const qaHistory = document.getElementById('qa-history');
        const currentQuestion = document.getElementById('current-question');
        const qNum = document.getElementById('q-num');
        const qText = document.getElementById('q-text');
        const inputArea = document.getElementById('input-area');
        const status = document.getElementById('status');
        const statusText = document.getElementById('status-text');
        const submitBtn = document.getElementById('submitBtn');
        const backBtn = document.getElementById('backBtn');

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
