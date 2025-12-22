import { DomIds, StatusMessages } from '../../../constants/ui';

/**
 * Generates message handlers for plan related messages
 */
export function generatePlanHandlers(): string {
    return `
        // Handle plan generation status
        if (message.type === 'generating') {
            currentQuestion.style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.GENERATING_PLAN}';
        }
        // Handle plan display
        else if (message.type === 'showPlan') {
            currentQuestion.style.display = 'none';
            status.style.display = 'none';
            document.getElementById('${DomIds.PLAN_PANEL}').style.display = 'block';
            document.getElementById('${DomIds.PLAN_CONTENT}').textContent = message.plan;
            resetFeedbackSection();

            // Update language select to reflect current state
            if (!message.isTranslated) {
                document.getElementById('${DomIds.LANG_SELECT}').value = 'English';
            }
        }
        // Handle translation status
        else if (message.type === 'translating') {
            document.getElementById('${DomIds.PLAN_PANEL}').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.TRANSLATING_PLAN}';
        }
        // Handle revision status
        else if (message.type === 'revising') {
            document.getElementById('${DomIds.PLAN_PANEL}').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.REVISING_PLAN}';
        }
    `;
}
