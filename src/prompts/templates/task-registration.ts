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
    return `You are a task registration assistant.

Extract the implementation steps from the following task plan and register each step as a todo item using the ${toolName} tool.

## Task Plan
${refinedPrompt}

## Instructions
1. Extract all numbered steps from the "## Steps" section
2. Use the ${toolName} tool to add each step as a todo item
3. After registering, confirm completion

Do NOT output the full plan in chat. Just register the todos and confirm.`;
}
