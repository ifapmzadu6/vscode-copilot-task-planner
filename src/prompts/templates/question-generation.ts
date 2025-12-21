import { CollectedAnswer } from '../../types/messages';
import { formatAnswersText } from './shared';

/**
 * Prompt template for question generation
 */

/**
 * Builds prompt for generating the next question
 */
export function buildNextQuestionPrompt(
    userRequest: string,
    context: string,
    answers: CollectedAnswer[]
): string {
    const answersText = formatAnswersText(answers);

    return `You are a task planning assistant. Generate the NEXT clarifying question.

## User Request
${userRequest}

## Context
${context}

## Previous Q&A
${answersText}

## Your Task
Before generating a question, you MAY investigate the workspace or use other tools if needed to understand the project better.
Then decide if you need more information. Ask about:
- Goals and success criteria
- Scope and boundaries
- Technical constraints
- Dependencies or risks

## Language Rule
IMPORTANT: Respond in the SAME LANGUAGE as the user's request. If the user wrote in Japanese, generate the question and options in Japanese. If in English, use English.

## Question Format Rules
- ALWAYS use "select" type with exactly 4 options
- Make options specific and relevant to THIS project based on your investigation
- The 5th "Other" option will be automatically added by the UI

## Output (JSON only)
If enough info: {"done": true, "reason": "brief reason"}
If need more: {"done": false, "question": {"text": "Question?", "type": "select", "options": ["Option 1", "Option 2", "Option 3", "Option 4"] }}

Return ONLY valid JSON.`;
}
