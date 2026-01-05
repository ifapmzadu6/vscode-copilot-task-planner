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

        try {
            const result = await invokeSubagent(`Translate plan to ${targetLang}`, prompt, toolInvocationToken, token);

            if (!result || result.trim().length === 0) {
                Logger.warn(`Translation to ${targetLang} returned empty result, using original plan`);
                return plan;
            }

            Logger.log(`Translation to ${targetLang} successful, result length: ${result.length}`);
            return result;
        } catch (error) {
            Logger.error(`Translation to ${targetLang} failed:`, error);
            return plan;
        }
    }
}
