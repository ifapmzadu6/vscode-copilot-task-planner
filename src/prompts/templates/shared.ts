import { CollectedAnswer } from '../../types/messages';

/**
 * Shared utilities for prompt templates
 */

/**
 * Readonly constraint to be included in all subagent prompts.
 * Ensures subagents do not modify files or execute commands.
 */
export const READONLY_CONSTRAINT = `## IMPORTANT: READ-ONLY MODE
You are operating in READ-ONLY mode. You MUST NOT:
- Create, modify, or delete any files
- Execute any shell commands that modify the system
- Make any changes to the codebase or filesystem

Your role is to ANALYZE, GENERATE TEXT OUTPUT, and PROVIDE INFORMATION only.
All file operations and code modifications will be performed by the main orchestrator.`;

/**
 * Formats collected answers into a readable text format
 */
export function formatAnswersText(answers: CollectedAnswer[]): string {
    if (answers.length === 0) {
        return 'No questions asked yet.';
    }
    return answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join('\n\n');
}
