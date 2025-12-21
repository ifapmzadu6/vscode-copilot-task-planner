import * as vscode from 'vscode';
import { Logger } from '../../utils/logger';
import { invokeSubagent } from '../../utils/subagent';
import { buildTranslatePlanPrompt } from '../../prompts/templates';

/**
 * Service responsible for translating plans to different languages.
 * Single Responsibility: Plan translation only.
 */
export class PlanTranslatorService {
    /**
     * Translates a plan to the specified language.
     *
     * @param plan - The plan to translate
     * @param targetLang - The target language
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The translated plan, or original plan if translation fails
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
}
