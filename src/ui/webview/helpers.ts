/**
 * Generates helper functions for the webview script
 */
export function generateHelperFunctions(): string {
    return `
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

        // Helper function to create input field based on question type
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

        // Helper function to get answer from input
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
    `;
}
