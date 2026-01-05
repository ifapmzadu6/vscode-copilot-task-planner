import * as vscode from 'vscode';
import { Logger } from '../../utils/logger';
import { invokeSubagent } from '../../utils/subagent';
import { buildRevisePlanPrompt } from '../../prompts/templates';

/**
 * Service responsible for revising plans based on user feedback.
 * Single Responsibility: Plan revision only.
 */
export class PlanReviserService {
    /**
     * Revises a plan based on user feedback.
     *
     * @param currentPlan - The current plan
     * @param feedback - The user's feedback
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The revised plan, or original plan if revision fails
     */
    async revise(
        currentPlan: string,
        feedback: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        Logger.log(`Revising plan with feedback: ${feedback}`);
        const prompt = buildRevisePlanPrompt(currentPlan, feedback);

        try {
            const result = await invokeSubagent('Revise plan based on feedback', prompt, toolInvocationToken, token);

            if (!result || result.trim().length === 0) {
                Logger.warn('Plan revision returned empty result, using original plan');
                return currentPlan;
            }

            Logger.log(`Revised plan length: ${result.length}`);
            return result;
        } catch (error) {
            Logger.error('Plan revision failed:', error);
            return currentPlan;
        }
    }
}
