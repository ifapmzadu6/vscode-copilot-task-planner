import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { safePostMessage, createPanelPromise } from '../utils/webview';
import { MessageHandlerBuilder } from '../utils/message-handler-builder';
import {
    PlanGeneratorService,
    PlanTranslatorService,
    PlanReviserService,
    TaskRegistrationService,
} from '../services/plan';
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
    /** The final approved plan content (empty if cancelled) */
    plan: string;
    /** The file path where the plan is saved (empty if cancelled) */
    planFilePath: string;
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
 * Dependencies for the plan confirmation orchestrator.
 */
export interface PlanConfirmationDependencies {
    generator?: PlanGeneratorService;
    translator?: PlanTranslatorService;
    reviser?: PlanReviserService;
    taskRegistration?: TaskRegistrationService;
}

/**
 * Orchestrates the plan confirmation phase of task planning.
 * Manages plan generation, revision, and translation with user approval.
 */
export class PlanConfirmationOrchestrator {
    private readonly generator: PlanGeneratorService;
    private readonly translator: PlanTranslatorService;
    private readonly reviser: PlanReviserService;
    private readonly taskRegistration: TaskRegistrationService;

    constructor(deps: PlanConfirmationDependencies = {}) {
        this.generator = deps.generator ?? new PlanGeneratorService();
        this.translator = deps.translator ?? new PlanTranslatorService();
        this.reviser = deps.reviser ?? new PlanReviserService();
        this.taskRegistration = deps.taskRegistration ?? new TaskRegistrationService();
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
        const planResult = await this.generator.generate(userRequest, context, answers, toolInvocationToken, token);

        let refinedPrompt = planResult.content;
        const planFilePath = planResult.filePath;

        Logger.log(`Generated plan length: ${refinedPrompt.length}`);
        Logger.log(`Plan saved to: ${planFilePath}`);
        Logger.log('Starting plan confirmation loop...');

        let panelClosed = false;
        panel.onDidDispose(() => {
            panelClosed = true;
        });

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- panelClosed is mutated in callback
        while (!panelClosed && !token.isCancellationRequested) {
            const confirmResult = await this.showPlanConfirmation(panel, refinedPrompt, toolInvocationToken, token);

            Logger.log(`Confirmation result: ${confirmResult?.type}`);

            if (confirmResult === null) {
                return { cancelled: true, plan: '', planFilePath: '' };
            }

            if (confirmResult.type === 'approve') {
                return { cancelled: false, plan: refinedPrompt, planFilePath };
            }

            if (confirmResult.feedback) {
                safePostMessage(panel, { type: ExtensionMessage.REVISING });

                refinedPrompt = await this.reviser.revise(
                    refinedPrompt,
                    confirmResult.feedback,
                    toolInvocationToken,
                    token
                );
            }
        }

        return { cancelled: true, plan: '', planFilePath: '' };
    }

    /**
     * Registers tasks from the approved plan to the todo list.
     *
     * @param plan - The approved plan
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @param todoToolName - The name of the todo tool to use
     */
    async registerTasks(
        plan: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken,
        todoToolName?: string
    ): Promise<void> {
        await this.taskRegistration.registerTasks(plan, toolInvocationToken, token, todoToolName);
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
            isTranslated: false,
        };

        const sendPlan = () => {
            safePostMessage(panel, {
                type: ExtensionMessage.SHOW_PLAN,
                plan: state.content,
                isTranslated: state.isTranslated,
            });
        };

        const handlers = new MessageHandlerBuilder<ConfirmResult | null>()
            .onReturn(WebviewMessage.APPROVE_PLAN, { type: 'approve' })
            .on(WebviewMessage.REVISE_PLAN, (msg) =>
                isReviseMessage(msg) ? { type: 'revise', feedback: msg.feedback } : undefined
            )
            .onContinue(WebviewMessage.TRANSLATE_PLAN, async (msg) => {
                if (!isTranslateMessage(msg)) return;

                safePostMessage(panel, { type: ExtensionMessage.TRANSLATING });
                try {
                    const translated = await this.translator.translate(
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
