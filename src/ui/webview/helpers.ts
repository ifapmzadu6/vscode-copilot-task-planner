import { DomIds, ButtonLabels } from '../../constants/ui';

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
                btn.textContent = '${ButtonLabels.REVISE_IDLE}';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            } else {
                btn.textContent = '${ButtonLabels.REVISE_ACTIVE}';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
            }
        }

        // Helper function to reset feedback section
        function resetFeedbackSection() {
            const feedbackSection = document.getElementById('${DomIds.FEEDBACK_SECTION}');
            const feedbackText = document.getElementById('${DomIds.FEEDBACK_TEXT}');
            const feedbackError = document.getElementById('${DomIds.FEEDBACK_ERROR}');
            const reviseBtn = document.getElementById('${DomIds.REVISE_BTN}');

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
                '<label class="option-item other-option"><input type="radio" name="answer" value="__OTHER__"> Other: <input type="text" id="${DomIds.OTHER_TEXT}" placeholder="Enter your answer..."></label>';
            } else if (question.type === 'multiline') {
                return '<textarea id="answer" rows="3" placeholder="Your answer..."></textarea>';
            } else {
                return '<input type="text" id="answer" placeholder="Your answer...">';
            }
        }

        // Helper function to set up event listeners after creating input field
        // Uses event delegation on inputArea to handle dynamically created elements
        function setupInputFieldListeners() {
            // Handle click/focus on "Other" text input to auto-select the radio
            const otherText = document.getElementById('${DomIds.OTHER_TEXT}');
            if (otherText) {
                const selectOtherRadio = function() {
                    const otherRadio = document.querySelector('input[value="__OTHER__"]');
                    if (otherRadio) {
                        otherRadio.checked = true;
                    }
                };
                otherText.addEventListener('click', selectOtherRadio);
                otherText.addEventListener('focus', selectOtherRadio);
            }
        }

        // Helper function to get answer from input
        function getAnswer() {
            // Check if this is a radio button question
            const radios = inputArea.querySelectorAll('input[type="radio"]');
            if (radios.length > 0) {
                // This is a select question - require a checked radio
                const radio = inputArea.querySelector('input[type="radio"]:checked');
                if (!radio) {
                    return ''; // No selection made
                }
                if (radio.value === '__OTHER__') {
                    const otherText = document.getElementById('${DomIds.OTHER_TEXT}');
                    return otherText ? otherText.value : '';
                }
                return radio.value;
            }
            // For text/multiline questions
            const input = inputArea.querySelector('input, textarea');
            return input ? input.value : '';
        }
    `;
}
