/**
 * Prompt template for task registration
 */

/**
 * Builds prompt for registering tasks to todo list
 */
export function buildRegisterTasksPrompt(refinedPrompt: string): string {
    return `You are a task registration assistant.

Extract the implementation steps from the following task plan and register each step as a todo item using the manage_todo_list tool.

## Task Plan
${refinedPrompt}

## Instructions
1. Extract all numbered steps from the "## Steps" section
2. Use the manage_todo_list tool to add each step as a todo item
3. After registering, confirm completion

Do NOT output the full plan in chat. Just register the todos and confirm.`;
}
