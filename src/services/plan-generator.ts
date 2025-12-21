import * as vscode from 'vscode';
import { CollectedAnswer } from '../types/messages';
import {
    PlanGeneratorService,
    PlanTranslatorService,
    PlanReviserService,
    TaskRegistrationService,
} from './plan';

/**
 * Facade for plan-related operations.
 * @deprecated Use individual services from './plan' instead:
 *   - PlanGeneratorService for generate()
 *   - PlanTranslatorService for translate()
 *   - PlanReviserService for revise()
 *   - TaskRegistrationService for registerTasks()
 */
export class PlanGenerator {
    private readonly generator = new PlanGeneratorService();
    private readonly translator = new PlanTranslatorService();
    private readonly reviser = new PlanReviserService();
    private readonly taskRegistration = new TaskRegistrationService();

    /**
     * @deprecated Use PlanGeneratorService.generate() instead
     */
    async generate(
        userRequest: string,
        context: string,
        answers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        return this.generator.generate(userRequest, context, answers, toolInvocationToken, token);
    }

    /**
     * @deprecated Use PlanTranslatorService.translate() instead
     */
    async translate(
        plan: string,
        targetLang: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        return this.translator.translate(plan, targetLang, toolInvocationToken, token);
    }

    /**
     * @deprecated Use PlanReviserService.revise() instead
     */
    async revise(
        currentPlan: string,
        feedback: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        return this.reviser.revise(currentPlan, feedback, toolInvocationToken, token);
    }

    /**
     * @deprecated Use TaskRegistrationService.registerTasks() instead
     */
    async registerTasks(
        refinedPrompt: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<void> {
        return this.taskRegistration.registerTasks(refinedPrompt, toolInvocationToken, token);
    }
}
