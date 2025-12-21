import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { invokeSubagent } from '../utils/subagent';
import { buildAnalyzeWorkspacePrompt } from '../prompts/templates';

/**
 * Service for analyzing workspace context.
 * Extracts relevant project information for task planning.
 */
export class WorkspaceAnalyzer {
    /**
     * Analyzes the workspace to provide context for the given task request.
     *
     * @param userRequest - The cleaned user request
     * @param fallbackContext - Optional fallback context if analysis fails
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The workspace context string
     */
    async analyze(
        userRequest: string,
        fallbackContext: string | undefined,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        Logger.log('Analyzing workspace context...');

        const workspaceContext = await invokeSubagent(
            'Analyze workspace context',
            buildAnalyzeWorkspacePrompt(userRequest),
            toolInvocationToken,
            token,
            { safe: true, defaultValue: fallbackContext || '' }
        );

        Logger.log(`Workspace context length: ${workspaceContext.length}`);
        return workspaceContext;
    }
}
