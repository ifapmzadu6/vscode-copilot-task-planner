import * as vscode from 'vscode';
import { Logger } from '../../utils/logger';
import { invokeSubagent } from '../../utils/subagent';
import { buildRegisterTasksPrompt } from '../../prompts/templates';

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
     */
    async registerTasks(
        refinedPrompt: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<void> {
        Logger.log('Registering tasks to todo list...');

        await invokeSubagent(
            'Register tasks to todo list',
            buildRegisterTasksPrompt(refinedPrompt),
            toolInvocationToken,
            token,
            {
                safe: true,
                onError: (error) => {
                    Logger.error('Failed to register tasks to todo list:', error);
                }
            }
        );

        Logger.log('Registered tasks to todo list via subagent');
    }
}
