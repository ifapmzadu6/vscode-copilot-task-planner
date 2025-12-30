import * as vscode from 'vscode';
import { Logger } from '../../utils/logger';
import { invokeSubagent } from '../../utils/subagent';
import { buildExtractTasksPrompt } from '../../prompts/templates';
import { parseJsonWithRetry } from '../../utils/json/parser';

/**
 * Task item structure
 */
interface TaskItem {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
}

/**
 * Response from task extraction
 */
interface ExtractedTasks {
    tasks: TaskItem[];
}

/**
 * Type guard for ExtractedTasks
 */
function isExtractedTasks(obj: unknown): obj is ExtractedTasks {
    if (typeof obj !== 'object' || obj === null) return false;
    const candidate = obj as Record<string, unknown>;
    if (!Array.isArray(candidate.tasks)) return false;
    return candidate.tasks.every(
        (task: unknown) =>
            typeof task === 'object' &&
            task !== null &&
            typeof (task as Record<string, unknown>).content === 'string'
    );
}

/**
 * Service responsible for registering tasks to the todo list.
 * Single Responsibility: Task registration only.
 */
export class TaskRegistrationService {
    private static readonly DEFAULT_TODO_TOOL_NAME = 'manage_todo_list';

    /**
     * Registers tasks from the plan to the todo list.
     *
     * @param refinedPrompt - The final plan
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @param todoToolName - The name of the todo tool to use
     */
    async registerTasks(
        refinedPrompt: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken,
        todoToolName?: string
    ): Promise<void> {
        Logger.log('=== Task Registration: Starting ===');
        Logger.log(`Task Registration: Plan length = ${refinedPrompt.length} chars`);
        Logger.log(`Task Registration: todoToolName = ${todoToolName ?? 'not specified (using default)'}`);

        // Step 1: Extract tasks using subagent
        Logger.log('Task Registration: Step 1 - Extracting tasks via subagent...');
        const extractedJson = await invokeSubagent(
            'Extract tasks from plan',
            buildExtractTasksPrompt(refinedPrompt),
            toolInvocationToken,
            token,
            {
                onError: (error) => {
                    Logger.error('Task Registration: Subagent extraction failed:', error);
                }
            }
        );

        if (!extractedJson) {
            Logger.error('Task Registration: Step 1 FAILED - No response from subagent');
            return;
        }
        Logger.log(`Task Registration: Step 1 Complete - Received ${extractedJson.length} chars`);
        Logger.log(`Task Registration: Raw response (first 500 chars): ${extractedJson.substring(0, 500)}`);

        // Step 2: Parse the JSON response
        Logger.log('Task Registration: Step 2 - Parsing JSON response...');
        const parsed = parseJsonWithRetry<ExtractedTasks>(extractedJson, isExtractedTasks);
        if (!parsed) {
            Logger.error('Task Registration: Step 2 FAILED - JSON parsing failed');
            return;
        }
        if (parsed.tasks.length === 0) {
            Logger.error('Task Registration: Step 2 FAILED - No tasks found in parsed result');
            return;
        }
        Logger.log(`Task Registration: Step 2 Complete - Parsed ${parsed.tasks.length} tasks`);
        parsed.tasks.forEach((task, i) => {
            Logger.log(`Task Registration: Task ${i + 1}: "${task.content}" (status: ${task.status})`);
        });

        // Step 3: Register tasks programmatically using vscode.lm.invokeTool
        const toolName = todoToolName ?? TaskRegistrationService.DEFAULT_TODO_TOOL_NAME;
        Logger.log(`Task Registration: Step 3 - Registering tasks via tool "${toolName}"...`);

        const todosPayload = parsed.tasks.map(task => ({
            content: task.content,
            status: task.status || 'pending',
            activeForm: this.toActiveForm(task.content)
        }));
        Logger.log(`Task Registration: Payload = ${JSON.stringify(todosPayload, null, 2)}`);

        try {
            Logger.log('Task Registration: Calling vscode.lm.invokeTool...');
            const result = await vscode.lm.invokeTool(
                toolName,
                {
                    input: { todos: todosPayload },
                    toolInvocationToken
                },
                token
            );
            Logger.log(`Task Registration: Step 3 Complete - Tool returned successfully`);
            Logger.log(`Task Registration: Tool result content length = ${result.content.length}`);
        } catch (error) {
            Logger.error('Task Registration: Step 3 FAILED - Tool invocation error:', error);
            if (error instanceof Error) {
                Logger.error(`Task Registration: Error message: ${error.message}`);
                Logger.error(`Task Registration: Error stack: ${error.stack}`);
            }
        }

        Logger.log('=== Task Registration: Finished ===');
    }

    /**
     * Converts a task content to active form (present continuous)
     * e.g., "Create the file" -> "Creating the file"
     */
    private toActiveForm(content: string): string {
        // Simple heuristic: prepend "Working on: " if we can't easily convert
        const trimmed = content.trim();

        // Try to convert common verb patterns
        const verbPatterns: [RegExp, string][] = [
            [/^Add\s/i, 'Adding '],
            [/^Create\s/i, 'Creating '],
            [/^Update\s/i, 'Updating '],
            [/^Fix\s/i, 'Fixing '],
            [/^Implement\s/i, 'Implementing '],
            [/^Write\s/i, 'Writing '],
            [/^Build\s/i, 'Building '],
            [/^Test\s/i, 'Testing '],
            [/^Remove\s/i, 'Removing '],
            [/^Delete\s/i, 'Deleting '],
            [/^Refactor\s/i, 'Refactoring '],
            [/^Configure\s/i, 'Configuring '],
            [/^Set up\s/i, 'Setting up '],
            [/^Install\s/i, 'Installing '],
            [/^Run\s/i, 'Running '],
            [/^Review\s/i, 'Reviewing '],
            [/^Verify\s/i, 'Verifying '],
            [/^Check\s/i, 'Checking '],
        ];

        for (const [pattern, replacement] of verbPatterns) {
            if (pattern.test(trimmed)) {
                return trimmed.replace(pattern, replacement);
            }
        }

        // Default: prepend "Working on: "
        return `Working on: ${trimmed}`;
    }
}
