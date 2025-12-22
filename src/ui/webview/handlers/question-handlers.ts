import { StatusMessages } from '../../../constants/ui';

/**
 * Generates message handlers for Q&A related messages
 */
export function generateQuestionHandlers(): string {
    return `
        // Handle new question display
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
        // Handle question answered confirmation
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
            statusText.textContent = '${StatusMessages.THINKING_NEXT_QUESTION}';
        }
        // Handle back navigation (remove last Q&A)
        else if (message.type === 'removeLastQA') {
            if (qaHistory.lastChild) {
                qaHistory.removeChild(qaHistory.lastChild);
            }
        }
    `;
}
