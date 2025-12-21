/**
 * Generates message handlers for the webview script
 */
export function generateMessageHandlers(): string {
    return `
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
    `;
}

/**
 * Generates event listeners for UI interactions
 */
export function generateEventListeners(): string {
    return `
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
