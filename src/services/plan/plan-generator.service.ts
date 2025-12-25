import * as vscode from 'vscode';
import { Logger } from '../../utils/logger';
import { invokeSubagent } from '../../utils/subagent';
import { buildRefinedPromptPrompt } from '../../prompts/templates';
import { CollectedAnswer } from '../../types/messages';

/**
 * Service responsible for generating task plans from collected requirements.
 * Single Responsibility: Plan generation only.
 */
export class PlanGeneratorService {
    /**
     * Generates a refined task plan based on collected information.
     *
     * @param userRequest - The cleaned user request
     * @param context - The workspace context
     * @param answers - The collected answers from Q&A
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The generated plan
     * @throws Error if no response is received
     */
    async generate(
        userRequest: string,
        context: string,
        answers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        Logger.log('Generating refined prompt...');
        const prompt = buildRefinedPromptPrompt(userRequest, context, answers);

        const result = await invokeSubagent(
            'Generate task prompt',
            prompt,
            toolInvocationToken,
            token,
            {
                fileOutput: {
                    filePrefix: 'plan'
                }
            }
        );

        if (!result) throw new Error('No response');
        Logger.log(`Generated plan length: ${result.length}`);
        return result;
    }
}
