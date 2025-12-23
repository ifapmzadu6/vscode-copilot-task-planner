import { escapeHtml } from '../utils/html';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { DomIds, StatusMessages, ButtonLabels } from '../constants/ui';
import { generateStyles } from './styles';
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

    <div id="${DomIds.QA_HISTORY}" class="qa-history"></div>

    <div id="${DomIds.CURRENT_QUESTION}" class="question-panel" style="display: none;">
        <div class="question-label">Question <span id="${DomIds.Q_NUM}">1</span></div>
        <div class="question-text" id="${DomIds.Q_TEXT}"></div>
        <div class="options-list" id="${DomIds.INPUT_AREA}"></div>
        <div class="button-row">
            <button type="button" class="btn-primary" id="${DomIds.SUBMIT_BTN}">Continue</button>
            <button type="button" class="btn-secondary" id="${DomIds.BACK_BTN}" style="display: none;">← Back</button>
        </div>
    </div>

    <div id="${DomIds.STATUS}" class="status-panel">
        <span class="spinner"></span>
        <span id="${DomIds.STATUS_TEXT}">${StatusMessages.ANALYZING_WORKSPACE}</span>
    </div>

    <div id="${DomIds.PLAN_PANEL}" class="question-panel" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="question-label" style="margin-bottom: 0;">Generated Plan</div>
            <div id="${DomIds.LANG_TOGGLE}" style="display: flex; gap: 4px; align-items: center;">
                <span style="font-size: 11px; color: var(--vscode-descriptionForeground);">🌐</span>
                <select id="${DomIds.LANG_SELECT}" style="padding: 4px 8px; font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; cursor: pointer;">
                    ${SUPPORTED_LANGUAGES.map(lang =>
                        `<option value="${escapeHtml(lang.value)}">${escapeHtml(lang.label)}</option>`
                    ).join('\n                    ')}
                </select>
            </div>
        </div>
        <div id="${DomIds.PLAN_CONTENT}" style="white-space: pre-wrap; font-size: 12px; background: var(--vscode-editor-background); padding: 12px; border-radius: 4px; margin-bottom: 12px;"></div>
        <div id="${DomIds.FEEDBACK_SECTION}" style="display: none; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div class="question-label" style="margin-bottom: 0;">Revision Request</div>
                <button type="button" id="${DomIds.FEEDBACK_CANCEL_BTN}" style="background: none; border: none; color: var(--vscode-descriptionForeground); cursor: pointer; font-size: 12px; padding: 2px 6px;">✕ Cancel</button>
            </div>
            <textarea id="${DomIds.FEEDBACK_TEXT}" rows="3" placeholder="Describe how you want to change the plan..."></textarea>
            <div id="${DomIds.FEEDBACK_ERROR}" style="display: none; color: var(--vscode-errorForeground); font-size: 11px; margin-top: 4px;"></div>
        </div>
        <div class="button-row">
            <button type="button" class="btn-primary" id="${DomIds.APPROVE_BTN}">✓ Approve</button>
            <button type="button" class="btn-secondary" id="${DomIds.REVISE_BTN}">${ButtonLabels.REVISE_IDLE}</button>
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
