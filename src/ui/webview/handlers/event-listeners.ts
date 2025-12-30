import { DomIds, StatusMessages } from '../../../constants/ui';

/**
 * Generates event listeners for Q&A interactions
 */
export function generateQuestionEventListeners(): string {
    return `
        const questionError = document.getElementById('${DomIds.QUESTION_ERROR}');

        // Helper to show/hide question error
        function showQuestionError(message) {
            questionError.textContent = message;
            questionError.style.display = 'inline';
        }
        function hideQuestionError() {
            questionError.style.display = 'none';
        }

        // Back button handler
        backBtn.addEventListener('click', () => {
            hideQuestionError();
            vscode.postMessage({ type: 'back' });
        });

        // Submit answer button handler
        submitBtn.addEventListener('click', () => {
            const answer = getAnswer();
            if (answer.trim()) {
                hideQuestionError();
                vscode.postMessage({ type: 'answer', answer: answer });
            } else {
                showQuestionError('${StatusMessages.SELECT_OPTION}');
            }
        });

        // Hide error when user selects an option
        inputArea.addEventListener('change', () => {
            hideQuestionError();
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
 * Generates event listeners for plan interactions
 */
export function generatePlanEventListeners(): string {
    return `
        // Approve plan button handler
        document.getElementById('${DomIds.APPROVE_BTN}').addEventListener('click', () => {
            const approveBtn = document.getElementById('${DomIds.APPROVE_BTN}');
            const reviseBtn = document.getElementById('${DomIds.REVISE_BTN}');
            const langSelect = document.getElementById('${DomIds.LANG_SELECT}');

            // Disable buttons to prevent double-click
            approveBtn.disabled = true;
            reviseBtn.disabled = true;
            langSelect.disabled = true;

            // Hide plan panel and show status
            document.getElementById('${DomIds.PLAN_PANEL}').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.PLAN_APPROVED}';

            vscode.postMessage({ type: 'approvePlan' });
        });

        // Revise plan button handler
        document.getElementById('${DomIds.REVISE_BTN}').addEventListener('click', () => {
            const feedbackSection = document.getElementById('${DomIds.FEEDBACK_SECTION}');
            const feedbackText = document.getElementById('${DomIds.FEEDBACK_TEXT}');
            const feedbackError = document.getElementById('${DomIds.FEEDBACK_ERROR}');
            const reviseBtn = document.getElementById('${DomIds.REVISE_BTN}');

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
                    feedbackError.textContent = '${StatusMessages.ENTER_REVISION}';
                    feedbackError.style.display = 'block';
                    feedbackText.focus();
                }
            }
        });

        // Cancel feedback button handler
        document.getElementById('${DomIds.FEEDBACK_CANCEL_BTN}').addEventListener('click', () => {
            resetFeedbackSection();
        });

        // Language select handler
        document.getElementById('${DomIds.LANG_SELECT}').addEventListener('change', (e) => {
            const lang = e.target.value;
            if (lang === 'English') {
                vscode.postMessage({ type: 'showOriginal' });
            } else {
                vscode.postMessage({ type: 'translatePlan', targetLang: lang });
            }
        });
    `;
}
