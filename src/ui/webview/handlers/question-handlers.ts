import { StatusMessages } from '../../../constants/ui';
import { ExtensionMessage } from '../../../types/messages';

/**
 * Generates message handlers for Q&A related messages
 */
export function generateQuestionHandlers(): string {
    return `
        // Handle new question display
        if (message.type === '${ExtensionMessage.NEW_QUESTION}') {
            currentQuestionData = message.question;
            qNum.textContent = message.questionNum;
            qText.textContent = message.question.text;
            inputArea.innerHTML = createInputField(message.question);
            currentQuestion.style.display = 'block';
            status.style.display = 'none';

            // Hide any previous error
            hideQuestionError();

            // Show/hide back button
            backBtn.style.display = message.canGoBack ? 'inline-block' : 'none';

            // Focus on the input
            const input = inputArea.querySelector('input, textarea');
            if (input) input.focus();

            // Auto-scroll to bottom
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
        }
        // Handle question answered confirmation
        else if (message.type === '${ExtensionMessage.QUESTION_ANSWERED}') {
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
            statusText.textContent = '${StatusMessages.THINKING_NEXT_QUESTION}';

            // Auto-scroll to bottom
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
        }
        // Handle back navigation (remove last Q&A)
        else if (message.type === '${ExtensionMessage.REMOVE_LAST_QA}') {
            if (qaHistory.lastChild) {
                qaHistory.removeChild(qaHistory.lastChild);
            }
        }
    `;
}
