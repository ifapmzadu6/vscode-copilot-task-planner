import { READONLY_CONSTRAINT } from './shared';

/**
 * Prompt template for task registration
 */

/**
 * Builds prompt for extracting tasks from a plan as JSON
 * @param refinedPrompt - The final plan
 */
export function buildExtractTasksPrompt(refinedPrompt: string): string {
    return `${READONLY_CONSTRAINT}

You are a task extraction assistant.

Extract the implementation steps from the following task plan and output them as JSON.

## Task Plan
${refinedPrompt}

## Instructions
1. Extract all numbered steps from the "## Steps" section
2. Each task should have a clear, actionable description
3. Output ONLY valid JSON, no other text

## Output Format
Output ONLY this JSON structure:

\`\`\`json
{
  "tasks": [
    { "content": "First task description", "status": "pending" },
    { "content": "Second task description", "status": "pending" }
  ]
}
\`\`\`

IMPORTANT: Output ONLY the JSON, no explanations or other text.`;
}
