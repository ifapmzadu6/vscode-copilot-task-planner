import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { invokeSubagent, invokeSubagentSafely } from '../utils/subagent';
import {
    buildRefinedPromptPrompt,
    buildTranslatePlanPrompt,
    buildRevisePlanPrompt,
    buildRegisterTasksPrompt,
} from '../prompts/templates';
import { CollectedAnswer } from '../types/messages';

/**
 * Service for generating, translating, and revising task plans.
 */
export class PlanGenerator {
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
            token
        );

        if (!result) throw new Error('No response');
        Logger.log(`Generated plan length: ${result.length}`);
        return result;
    }

    /**
     * Translates a plan to the specified language.
     *
     * @param plan - The plan to translate
     * @param targetLang - The target language
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The translated plan
     */
    async translate(
        plan: string,
        targetLang: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        Logger.log(`Translating plan to ${targetLang}`);
        const prompt = buildTranslatePlanPrompt(plan, targetLang);

        const result = await invokeSubagent(
            `Translate plan to ${targetLang}`,
            prompt,
            toolInvocationToken,
            token
        );

        return result || plan;
    }

    /**
     * Revises a plan based on user feedback.
     *
     * @param currentPlan - The current plan
     * @param feedback - The user's feedback
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The revised plan
     */
    async revise(
        currentPlan: string,
        feedback: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        Logger.log(`Revising plan with feedback: ${feedback}`);
        const prompt = buildRevisePlanPrompt(currentPlan, feedback);

        const result = await invokeSubagent(
            'Revise plan based on feedback',
            prompt,
            toolInvocationToken,
            token
        );

        Logger.log(`Revised plan length: ${result?.length || 0}`);
        return result || currentPlan;
    }

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

        await invokeSubagentSafely(
            'Register tasks to todo list',
            buildRegisterTasksPrompt(refinedPrompt),
            toolInvocationToken,
            token,
            {
                onError: (error) => {
                    Logger.error('Failed to register tasks to todo list:', error);
                }
            }
        );

        Logger.log('Registered tasks to todo list via subagent');
    }
}
