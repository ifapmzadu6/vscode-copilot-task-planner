import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { safePostMessage, createPanelPromise } from '../utils/panel';
import { MessageHandlerBuilder } from '../utils/message-handler-builder';
import { PlanGenerator } from '../services';
import {
    CollectedAnswer,
    ConfirmResult,
    ExtensionMessage,
    WebviewMessage,
    isReviseMessage,
    isTranslateMessage,
} from '../types/messages';

/**
 * Result of the plan confirmation flow
 */
export interface PlanConfirmationResult {
    /** Whether the flow was cancelled */
    cancelled: boolean;
    /** The final approved plan (empty if cancelled) */
    plan: string;
}

/**
 * Options for running the plan confirmation flow
 */
export interface PlanConfirmationOptions {
    panel: vscode.WebviewPanel;
    userRequest: string;
    context: string;
    answers: CollectedAnswer[];
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined;
    token: vscode.CancellationToken;
}

/**
 * Orchestrates the plan confirmation phase of task planning.
 * Manages plan generation, revision, and translation with user approval.
 */
export class PlanConfirmationOrchestrator {
    private readonly planGenerator: PlanGenerator;

    constructor(planGenerator?: PlanGenerator) {
        this.planGenerator = planGenerator ?? new PlanGenerator();
    }

    /**
     * Runs the complete plan confirmation flow.
     *
     * @param options - Flow options including panel, request, context, answers, and tokens
     * @returns Result containing the approved plan or cancellation status
     */
    async run(options: PlanConfirmationOptions): Promise<PlanConfirmationResult> {
        const { panel, userRequest, context, answers, toolInvocationToken, token } = options;

        Logger.log('Generating initial plan...');
        let refinedPrompt = await this.planGenerator.generate(
            userRequest,
            context,
            answers,
            toolInvocationToken,
            token
        );

        Logger.log(`Generated plan length: ${refinedPrompt.length}`);
        Logger.log('Starting plan confirmation loop...');

        let panelClosed = false;
        panel.onDidDispose(() => { panelClosed = true; });

        while (!panelClosed && !token.isCancellationRequested) {
            const confirmResult = await this.showPlanConfirmation(
                panel,
                refinedPrompt,
                toolInvocationToken,
                token
            );

            Logger.log(`Confirmation result: ${confirmResult?.type}`);

            if (confirmResult === null) {
                return { cancelled: true, plan: '' };
            }

            if (confirmResult.type === 'approve') {
                return { cancelled: false, plan: refinedPrompt };
            }

            if (confirmResult.type === 'revise' && confirmResult.feedback) {
                safePostMessage(panel, { type: ExtensionMessage.REVISING });

                refinedPrompt = await this.planGenerator.revise(
                    refinedPrompt,
                    confirmResult.feedback,
                    toolInvocationToken,
                    token
                );
            }
        }

        return { cancelled: true, plan: '' };
    }

    /**
     * Registers tasks from the approved plan to the todo list.
     *
     * @param plan - The approved plan
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     */
    async registerTasks(
        plan: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<void> {
        await this.planGenerator.registerTasks(plan, toolInvocationToken, token);
    }

    /**
     * Shows plan confirmation dialog and waits for user response.
     */
    private showPlanConfirmation(
        panel: vscode.WebviewPanel,
        plan: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<ConfirmResult | null> {
        Logger.log('showPlanConfirmation');

        // State for plan display
        const state = {
            content: plan,
            isTranslated: false
        };

        const sendPlan = () => {
            safePostMessage(panel, {
                type: ExtensionMessage.SHOW_PLAN,
                plan: state.content,
                isTranslated: state.isTranslated
            });
        };

        const handlers = new MessageHandlerBuilder<ConfirmResult | null>()
            .onReturn(WebviewMessage.APPROVE_PLAN, { type: 'approve' })
            .on(WebviewMessage.REVISE_PLAN, (msg) =>
                isReviseMessage(msg)
                    ? { type: 'revise', feedback: msg.feedback }
                    : undefined
            )
            .onContinue(WebviewMessage.TRANSLATE_PLAN, async (msg) => {
                if (!isTranslateMessage(msg)) return;

                safePostMessage(panel, { type: ExtensionMessage.TRANSLATING });
                try {
                    const translated = await this.planGenerator.translate(
                        plan,
                        msg.targetLang,
                        toolInvocationToken,
                        token
                    );
                    state.content = translated;
                    state.isTranslated = true;
                    sendPlan();
                } catch (error) {
                    Logger.error('Translation error:', error);
                    sendPlan();
                }
            })
            .onContinue(WebviewMessage.SHOW_ORIGINAL, () => {
                state.content = plan;
                state.isTranslated = false;
                sendPlan();
            })
            .onReturn(WebviewMessage.CANCEL, null)
            .build();

        return createPanelPromise(panel, handlers, token, sendPlan);
    }
}
