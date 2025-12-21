import { CollectedAnswer } from '../../types/messages';

/**
 * Shared utilities for prompt templates
 */

/**
 * Formats collected answers into a readable text format
 */
export function formatAnswersText(answers: CollectedAnswer[]): string {
    if (answers.length === 0) {
        return 'No questions asked yet.';
    }
    return answers
        .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
        .join('\n\n');
}
