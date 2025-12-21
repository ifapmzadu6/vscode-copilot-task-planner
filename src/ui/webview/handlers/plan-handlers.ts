/**
 * Generates message handlers for plan related messages
 */
export function generatePlanHandlers(): string {
    return `
        // Handle plan generation status
        if (message.type === 'generating') {
            currentQuestion.style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = 'Generating detailed plan...';
        }
        // Handle plan display
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
        // Handle translation status
        else if (message.type === 'translating') {
            document.getElementById('plan-panel').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = 'Translating plan...';
        }
        // Handle revision status
        else if (message.type === 'revising') {
            document.getElementById('plan-panel').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = 'Revising plan based on feedback...';
        }
    `;
}
