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
        document.getElementById('approveBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'approvePlan' });
        });

        // Revise plan button handler
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

        // Cancel plan button handler
        document.getElementById('planCancelBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'cancel' });
        });

        // Cancel feedback button handler
        document.getElementById('feedbackCancelBtn').addEventListener('click', () => {
            resetFeedbackSection();
        });

        // Language select handler
        document.getElementById('lang-select').addEventListener('change', (e) => {
            const lang = e.target.value;
            if (lang === 'English') {
                vscode.postMessage({ type: 'showOriginal' });
            } else {
                vscode.postMessage({ type: 'translatePlan', targetLang: lang });
            }
        });
    `;
}
