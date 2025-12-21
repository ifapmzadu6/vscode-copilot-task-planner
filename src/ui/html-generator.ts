import { escapeHtml } from '../utils/html';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

/**
 * Generates CSS styles for the webview
 */
function generateStyles(): string {
    return `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
            font-size: var(--vscode-font-size, 13px);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 16px;
            line-height: 1.4;
        }
        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        }
        .header-icon { font-size: 16px; }
        .header-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        .task-info {
            background: var(--vscode-textBlockQuote-background);
            border-left: 2px solid var(--vscode-textLink-activeForeground);
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        .task-info strong { color: var(--vscode-foreground); }
        .qa-history { margin-bottom: 12px; }
        .qa-item {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .qa-item .q {
            color: var(--vscode-textLink-foreground);
            font-weight: 500;
            margin-bottom: 4px;
        }
        .qa-item .a { color: var(--vscode-foreground); }
        .question-panel {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-focusBorder);
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 12px;
        }
        .question-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 6px;
        }
        .question-text {
            font-size: 13px;
            color: var(--vscode-foreground);
            margin-bottom: 12px;
            font-weight: 500;
        }
        .options-list { display: flex; flex-direction: column; gap: 6px; }
        .option-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            cursor: pointer;
            transition: border-color 0.1s, background 0.1s;
        }
        .option-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
        }
        .option-item input[type="radio"] {
            accent-color: var(--vscode-focusBorder);
        }
        .option-item.other-option { flex-wrap: wrap; }
        .option-item.other-option input[type="text"] {
            flex: 1;
            min-width: 150px;
            margin-left: 4px;
        }
        input[type="text"], textarea {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
            font-family: inherit;
            font-size: 13px;
            outline: none;
        }
        input[type="text"]:focus, textarea:focus {
            border-color: var(--vscode-focusBorder);
        }
        textarea { resize: vertical; min-height: 60px; }
        .button-row {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        button {
            padding: 6px 14px;
            border-radius: 2px;
            font-size: 13px;
            cursor: pointer;
            border: none;
            font-family: inherit;
        }
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
        .status-panel {
            display: none;
            text-align: center;
            padding: 24px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        .spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid var(--vscode-input-border);
            border-top-color: var(--vscode-focusBorder);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;
}

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
 * Generates the JavaScript for the webview
 */
function generateScript(): string {
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

        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Helper function to set revise button state
        function setReviseButtonState(btn, state) {
            if (state === 'idle') {
                btn.textContent = '✎ Revise';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            } else {
                btn.textContent = '📤 Send Revision';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
            }
        }

        // Helper function to reset feedback section
        function resetFeedbackSection() {
            const feedbackSection = document.getElementById('feedback-section');
            const feedbackText = document.getElementById('feedback-text');
            const feedbackError = document.getElementById('feedback-error');
            const reviseBtn = document.getElementById('reviseBtn');

            feedbackSection.style.display = 'none';
            feedbackText.value = '';
            feedbackError.style.display = 'none';
            setReviseButtonState(reviseBtn, 'idle');
        }

        window.addEventListener('message', event => {
            const message = event.data;

            if (message.type === 'newQuestion') {
                currentQuestionData = message.question;
                qNum.textContent = message.questionNum;
                qText.textContent = message.question.text;
                inputArea.innerHTML = createInputField(message.question);
                currentQuestion.style.display = 'block';
                status.style.display = 'none';

                // Show/hide back button
                backBtn.style.display = message.canGoBack ? 'inline-block' : 'none';

                // Focus on the input
                const input = inputArea.querySelector('input, textarea');
                if (input) input.focus();
            }
            else if (message.type === 'questionAnswered') {
                const item = document.createElement('div');
                item.className = 'qa-item';

                const qDiv = document.createElement('div');
                qDiv.className = 'q';
                qDiv.textContent = 'Q' + message.questionNum + ': ' + message.question;

                const aDiv = document.createElement('div');
                aDiv.className = 'a';
                aDiv.textContent = message.answer;

                item.appendChild(qDiv);
                item.appendChild(aDiv);
                qaHistory.appendChild(item);

                currentQuestion.style.display = 'none';
                status.style.display = 'block';
                statusText.textContent = 'Thinking of next question...';
            }
            else if (message.type === 'removeLastQA') {
                if (qaHistory.lastChild) {
                    qaHistory.removeChild(qaHistory.lastChild);
                }
            }
            else if (message.type === 'generating') {
                currentQuestion.style.display = 'none';
                status.style.display = 'block';
                statusText.textContent = 'Generating detailed plan...';
            }
            else if (message.type === 'showPlan') {
                currentQuestion.style.display = 'none';
                status.style.display = 'none';
                document.getElementById('plan-panel').style.display = 'block';
                document.getElementById('plan-content').textContent = message.plan;
                resetFeedbackSection();

                // Update language select to reflect current state
                if (!message.isTranslated) {
                    document.getElementById('lang-select').value = 'English';
                }
            }
            else if (message.type === 'translating') {
                document.getElementById('plan-panel').style.display = 'none';
                status.style.display = 'block';
                statusText.textContent = 'Translating plan...';
            }
            else if (message.type === 'revising') {
                document.getElementById('plan-panel').style.display = 'none';
                status.style.display = 'block';
                statusText.textContent = 'Revising plan based on feedback...';
            }
        });

        backBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'back' });
        });

        document.getElementById('approveBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'approvePlan' });
        });

        document.getElementById('reviseBtn').addEventListener('click', () => {
            const feedbackSection = document.getElementById('feedback-section');
            const feedbackText = document.getElementById('feedback-text');
            const feedbackError = document.getElementById('feedback-error');
            const reviseBtn = document.getElementById('reviseBtn');

            if (feedbackSection.style.display === 'none') {
                // Show feedback section and change button text
                feedbackSection.style.display = 'block';
                setReviseButtonState(reviseBtn, 'active');
                feedbackError.style.display = 'none';
                feedbackText.focus();
            } else {
                const feedback = feedbackText.value.trim();
                if (feedback) {
                    feedbackError.style.display = 'none';
                    vscode.postMessage({ type: 'revisePlan', feedback: feedback });
                } else {
                    // Show error for empty feedback
                    feedbackError.textContent = 'Please enter your revision request.';
                    feedbackError.style.display = 'block';
                    feedbackText.focus();
                }
            }
        });

        document.getElementById('planCancelBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'cancel' });
        });

        document.getElementById('feedbackCancelBtn').addEventListener('click', () => {
            resetFeedbackSection();
        });

        document.getElementById('lang-select').addEventListener('change', (e) => {
            const lang = e.target.value;
            if (lang === 'English') {
                vscode.postMessage({ type: 'showOriginal' });
            } else {
                vscode.postMessage({ type: 'translatePlan', targetLang: lang });
            }
        });

        function createInputField(question) {
            if (question.type === 'select' && question.options) {
                return question.options.map(opt =>
                    '<label class="option-item"><input type="radio" name="answer" value="' + escapeHtml(opt) + '"> ' + escapeHtml(opt) + '</label>'
                ).join('') +
                '<label class="option-item other-option"><input type="radio" name="answer" value="__OTHER__"> Other: <input type="text" id="other-text" placeholder="Enter your answer..." onclick="document.querySelector(\\'input[value=__OTHER__]\\').checked = true;"></label>';
            } else if (question.type === 'multiline') {
                return '<textarea id="answer" rows="3" placeholder="Your answer..."></textarea>';
            } else {
                return '<input type="text" id="answer" placeholder="Your answer...">';
            }
        }

        function getAnswer() {
            const radio = inputArea.querySelector('input[type="radio"]:checked');
            if (radio) {
                if (radio.value === '__OTHER__') {
                    const otherText = document.getElementById('other-text');
                    return otherText ? otherText.value : '';
                }
                return radio.value;
            }
            const input = inputArea.querySelector('input, textarea');
            return input ? input.value : '';
        }

        submitBtn.addEventListener('click', () => {
            const answer = getAnswer();
            if (answer.trim()) {
                vscode.postMessage({ type: 'answer', answer: answer });
            }
        });

        // Handle Enter key for text inputs
        inputArea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && currentQuestionData?.type !== 'multiline') {
                e.preventDefault();
                submitBtn.click();
            }
        });
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
