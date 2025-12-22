import { DomIds, StatusMessages } from '../../../constants/ui';
import { ExtensionMessage } from '../../../types/messages';

/**
 * Generates message handlers for plan related messages
 */
export function generatePlanHandlers(): string {
    return `
        // Handle plan generation status
        if (message.type === '${ExtensionMessage.GENERATING}') {
            currentQuestion.style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.GENERATING_PLAN}';
        }
        // Handle plan display
        else if (message.type === '${ExtensionMessage.SHOW_PLAN}') {
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
        else if (message.type === '${ExtensionMessage.TRANSLATING}') {
            document.getElementById('${DomIds.PLAN_PANEL}').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.TRANSLATING_PLAN}';
        }
        // Handle revision status
        else if (message.type === '${ExtensionMessage.REVISING}') {
            document.getElementById('${DomIds.PLAN_PANEL}').style.display = 'none';
            status.style.display = 'block';
            statusText.textContent = '${StatusMessages.REVISING_PLAN}';
        }
    `;
}
