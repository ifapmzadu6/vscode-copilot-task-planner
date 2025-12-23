/**
 * Prompt template for task registration
 */

/**
 * Default todo tool name
 */
const DEFAULT_TODO_TOOL_NAME = 'manage_todo_list';

/**
 * Builds prompt for registering tasks to todo list
 * @param refinedPrompt - The final plan
 * @param todoToolName - The name of the todo tool to use (defaults to 'manage_todo_list')
 */
export function buildRegisterTasksPrompt(refinedPrompt: string, todoToolName?: string): string {
    const toolName = todoToolName ?? DEFAULT_TODO_TOOL_NAME;
    return `You are a task extraction assistant.

Extract the implementation steps from the following task plan and output them as a structured task list.

## Task Plan
${refinedPrompt}

## Instructions
1. Extract all numbered steps from the "## Steps" section
2. Output each step as a clear, actionable task item
3. Do NOT call any tools directly - just output the extracted tasks

## Output Format
Output the tasks in the following format, then add instructions for the user:

---
## Tasks to Register

1. [First task]
2. [Second task]
...

---

Please register these tasks using the ${toolName} tool and proceed with the implementation.
---`;
}
