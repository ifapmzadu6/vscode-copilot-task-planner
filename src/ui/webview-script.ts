/**
 * Generates the JavaScript for the webview
 */
export function generateScript(): string {
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
