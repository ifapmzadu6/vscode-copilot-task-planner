import { escapeHtml } from '../utils/html';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { generateStyles } from './webview-styles';
import { generateScript } from './webview-script';

/**
 * Generates the HTML structure for the webview
 */
function generateHtmlStructure(userRequest: string): string {
    return `
    <div class="header">
        <span class="header-icon">📋</span>
        <span class="header-title">Task Planner</span>
    </div>
    <div class="task-info">
        <strong>Task:</strong> ${escapeHtml(userRequest)}
    </div>

    <div id="qa-history" class="qa-history"></div>

    <div id="current-question" class="question-panel" style="display: none;">
        <div class="question-label">Question <span id="q-num">1</span></div>
        <div class="question-text" id="q-text"></div>
        <div class="options-list" id="input-area"></div>
        <div class="button-row">
            <button type="button" class="btn-primary" id="submitBtn">Continue</button>
            <button type="button" class="btn-secondary" id="backBtn" style="display: none;">← Back</button>
        </div>
    </div>

    <div id="status" class="status-panel">
        <span class="spinner"></span>
        <span id="status-text">Analyzing workspace...</span>
    </div>

    <div id="plan-panel" class="question-panel" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="question-label" style="margin-bottom: 0;">Generated Plan</div>
            <div id="lang-toggle" style="display: flex; gap: 4px; align-items: center;">
                <span style="font-size: 11px; color: var(--vscode-descriptionForeground);">🌐</span>
                <select id="lang-select" style="padding: 4px 8px; font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; cursor: pointer;">
                    ${SUPPORTED_LANGUAGES.map(lang =>
                        `<option value="${escapeHtml(lang.value)}">${escapeHtml(lang.label)}</option>`
                    ).join('\n                    ')}
                </select>
            </div>
        </div>
        <div id="plan-content" style="white-space: pre-wrap; font-size: 12px; max-height: 400px; overflow-y: auto; background: var(--vscode-editor-background); padding: 12px; border-radius: 4px; margin-bottom: 12px;"></div>
        <div id="feedback-section" style="display: none; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div class="question-label" style="margin-bottom: 0;">Revision Request</div>
                <button type="button" id="feedbackCancelBtn" style="background: none; border: none; color: var(--vscode-descriptionForeground); cursor: pointer; font-size: 12px; padding: 2px 6px;">✕ Cancel</button>
            </div>
            <textarea id="feedback-text" rows="3" placeholder="Describe how you want to change the plan..."></textarea>
            <div id="feedback-error" style="display: none; color: var(--vscode-errorForeground); font-size: 11px; margin-top: 4px;"></div>
        </div>
        <div class="button-row">
            <button type="button" class="btn-primary" id="approveBtn">✓ Approve</button>
            <button type="button" class="btn-secondary" id="reviseBtn">✎ Revise</button>
            <button type="button" class="btn-secondary" id="planCancelBtn">Cancel</button>
        </div>
    </div>
    `;
}

/**
 * Generates the complete base HTML for the webview
 *
 * @param userRequest - The user's task request to display
 * @returns Complete HTML string for the webview
 */
export function generateBaseHtml(userRequest: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Planner</title>
    <style>${generateStyles()}</style>
</head>
<body>
    ${generateHtmlStructure(userRequest)}
    <script>${generateScript()}</script>
</body>
</html>`;
}
