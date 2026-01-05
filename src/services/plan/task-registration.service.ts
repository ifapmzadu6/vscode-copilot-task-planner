import * as vscode from 'vscode';
import { RuntimeConfig } from '../../constants/runtime';
import { Logger } from '../../utils/logger';
import { invokeSubagent } from '../../utils/subagent';
import { buildExtractTasksPrompt } from '../../prompts/templates';
import { parseJsonWithRetry } from '../../utils/json/parser';

/**
 * Task status matching manage_todo_list schema
 */
type TaskStatus = 'not-started' | 'in-progress' | 'completed';

/**
 * Task item extracted from plan
 */
interface ExtractedTask {
    content: string;
    status?: TaskStatus;
}

/**
 * Todo item matching manage_todo_list schema
 */
interface TodoItem {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
}

/**
 * Response from task extraction
 */
interface ExtractedTasks {
    tasks: ExtractedTask[];
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
            typeof task === 'object' && task !== null && typeof (task as Record<string, unknown>).content === 'string'
    );
}

/**
 * Service responsible for registering tasks to the todo list.
 * Single Responsibility: Task registration only.
 */
export class TaskRegistrationService {
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
                },
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
            Logger.log(`Task Registration: Task ${i + 1}: "${task.content}"`);
        });

        // Step 3: Register tasks programmatically using vscode.lm.invokeTool
        const toolName = todoToolName ?? RuntimeConfig.DEFAULT_TODO_TOOL_NAME;
        Logger.log(`Task Registration: Step 3 - Registering tasks via tool "${toolName}"...`);

        // Convert extracted tasks to manage_todo_list schema
        const todoList: TodoItem[] = parsed.tasks.map((task, index) => ({
            id: index + 1,
            title: this.extractTitle(task.content),
            description: task.content,
            status: 'not-started' as TaskStatus,
        }));
        Logger.log(`Task Registration: Payload = ${JSON.stringify({ todoList }, null, 2)}`);

        try {
            Logger.log('Task Registration: Calling vscode.lm.invokeTool...');
            const result = await vscode.lm.invokeTool(
                toolName,
                {
                    input: { todoList },
                    toolInvocationToken,
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
     * Extracts a short title from task content (first 7 words or less)
     */
    private extractTitle(content: string): string {
        const words = content.trim().split(/\s+/);
        const title = words.slice(0, 7).join(' ');
        return words.length > 7 ? `${title}...` : title;
    }
}
