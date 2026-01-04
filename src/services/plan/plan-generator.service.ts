import * as vscode from 'vscode';
import { Logger } from '../../utils/logger';
import { invokeSubagentWithFileOutput } from '../../utils/subagent';
import { buildPlanGenerationPrompt } from '../../prompts/templates';
import { CollectedAnswer } from '../../types/messages';

/**
 * Result from plan generation
 */
export interface PlanGenerationResult {
    /** The generated plan content */
    content: string;
    /** The file path where the plan is saved */
    filePath: string;
}

/**
 * Service responsible for generating task plans from collected requirements.
 * Single Responsibility: Plan generation only.
 */
export class PlanGeneratorService {
    /**
     * Generates a refined task plan based on collected information.
     * The plan is written to a file and both content and path are returned.
     *
     * @param userRequest - The cleaned user request
     * @param context - The workspace context
     * @param answers - The collected answers from Q&A
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The generated plan content and file path
     * @throws Error if generation fails
     */
    async generate(
        userRequest: string,
        context: string,
        answers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<PlanGenerationResult> {
        Logger.log('=== Plan Generator: Starting ===');
        Logger.log(`Plan Generator: userRequest length = ${userRequest.length}`);
        Logger.log(`Plan Generator: context length = ${context.length}`);
        Logger.log(`Plan Generator: answers count = ${answers.length}`);

        const prompt = buildPlanGenerationPrompt(userRequest, context, answers);
        Logger.log(`Plan Generator: Prompt length = ${prompt.length}`);

        Logger.log('Plan Generator: Invoking subagent with file output...');
        const result = await invokeSubagentWithFileOutput('Generate task prompt', prompt, toolInvocationToken, token);

        if (!result) {
            Logger.error('Plan Generator: Failed to generate plan');
            throw new Error('Failed to generate plan');
        }

        Logger.log(`Plan Generator: Plan content length = ${result.content.length}`);
        Logger.log(`Plan Generator: Plan file path = ${result.filePath}`);
        Logger.log(`Plan Generator: Plan content (first 300 chars): ${result.content.substring(0, 300)}`);
        Logger.log('=== Plan Generator: Complete ===');

        return {
            content: result.content,
            filePath: result.filePath,
        };
    }
}
