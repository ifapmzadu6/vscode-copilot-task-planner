import { DomIds, StatusMessages } from '../../../constants/ui';

/**
 * Generates event listeners for Q&A interactions
 */
export function generateQuestionEventListeners(): string {
    return `
        // Back button handler
        backBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'back' });
        });

        // Submit answer button handler
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
 * Generates event listeners for plan interactions
 */
export function generatePlanEventListeners(): string {
    return `
        // Approve plan button handler
        document.getElementById('${DomIds.APPROVE_BTN}').addEventListener('click', () => {
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

        // Cancel plan button handler
        document.getElementById('${DomIds.PLAN_CANCEL_BTN}').addEventListener('click', () => {
            vscode.postMessage({ type: 'cancel' });
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
