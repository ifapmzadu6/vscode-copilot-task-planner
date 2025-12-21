import * as vscode from 'vscode';

// Import types
import {
    PlanToolInput,
    Question,
    ConfirmResult,
    MessageHandler,
    ExtensionMessage,
    WebviewMessage,
    WebviewIncomingMessage,
    isAnswerMessage,
    isReviseMessage,
    isTranslateMessage,
} from './types/messages';

// Import constants
import { Config } from './constants/config';

// Import services
import { WorkspaceAnalyzer, QuestionEngine, PlanGenerator, QuestionContext } from './services';

// Import utilities
import { Logger } from './utils/logger';
import { safePostMessage, createPanelPromise } from './utils/panel';

// Import UI generators
import { generateBaseHtml } from './ui/html-generator';

// ============================================================
// Task Planner Tool
// ============================================================

/**
 * Task Planner Tool
 * Uses runSubagent + single persistent Webview for dynamic interactive question flow
 */
class TaskPlannerTool implements vscode.LanguageModelTool<PlanToolInput> {
    private readonly workspaceAnalyzer = new WorkspaceAnalyzer();
    private readonly questionEngine = new QuestionEngine();
    private readonly planGenerator = new PlanGenerator();

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<PlanToolInput>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { userRequest, context } = options.input;
        Logger.log(`invoke called with userRequest: ${userRequest}`);

        const cleanRequest = this.cleanUserRequest(userRequest);
        Logger.log(`cleanRequest: ${cleanRequest}`);

        let panel: vscode.WebviewPanel | null = null;

        try {
            // Step 1: Analyze workspace context
            Logger.log('Step 1: Analyzing workspace context...');
            const fullContext = await this.workspaceAnalyzer.analyze(
                cleanRequest,
                context,
                options.toolInvocationToken,
                token
            );

            // Step 2: Create persistent Webview panel
            panel = this.createWebviewPanel(cleanRequest);

            // Step 3: Run question loop
            const collectedAnswers = await this.runQuestionLoop(
                panel,
                cleanRequest,
                fullContext,
                options.toolInvocationToken,
                token
            );

            if (collectedAnswers === null) {
                panel.dispose();
                return this.createCancelledResult();
            }

            // Step 4: Generate and confirm plan
            const refinedPrompt = await this.runPlanConfirmationLoop(
                panel,
                cleanRequest,
                fullContext,
                collectedAnswers,
                options.toolInvocationToken,
                token
            );

            if (refinedPrompt === null) {
                panel.dispose();
                return this.createCancelledResult();
            }

            // Step 5: Register tasks to todo list
            await this.planGenerator.registerTasks(
                refinedPrompt,
                options.toolInvocationToken,
                token
            );

            // Cleanup and return
            panel.dispose();
            Logger.log('Returning refined prompt');
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(refinedPrompt)
            ]);

        } catch (error) {
            Logger.error('Error:', error);
            panel?.dispose();

            if (error instanceof Error && error.message === 'Cancelled by user') {
                return this.createCancelledResult();
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error during planning: ${errorMessage}`)
            ]);
        }
    }

    // ============================================================
    // Panel Creation
    // ============================================================

    /**
     * Creates the webview panel
     */
    private createWebviewPanel(cleanRequest: string): vscode.WebviewPanel {
        Logger.log('Step 2: Creating Webview panel...');

        const panel = vscode.window.createWebviewPanel(
            Config.UI.PANEL_ID,
            Config.UI.PANEL_TITLE,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = generateBaseHtml(cleanRequest);
        Logger.log('Webview panel created');
        return panel;
    }

    // ============================================================
    // Question Loop
    // ============================================================

    /**
     * Runs the question loop phase
     * Returns collected answers or null if cancelled
     */
    private async runQuestionLoop(
        panel: vscode.WebviewPanel,
        cleanRequest: string,
        fullContext: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<typeof ctx.answers | null> {
        Logger.log('Step 3: Starting question loop...');

        const ctx = this.questionEngine.createContext();
        let panelClosed = false;

        panel.onDidDispose(() => {
            Logger.log('Panel disposed');
            panelClosed = true;
        });

        while (ctx.currentIndex < Config.MAX_QUESTIONS) {
            Logger.log(`Question loop iteration ${ctx.currentIndex + 1}`);

            if (token.isCancellationRequested || panelClosed) {
                Logger.log(token.isCancellationRequested ? 'Cancellation requested' : 'Panel was closed');
                break;
            }

            // Get or generate question
            const questionResponse = await this.questionEngine.getOrGenerateQuestion(
                ctx,
                cleanRequest,
                fullContext,
                toolInvocationToken,
                token
            );

            if (!questionResponse || questionResponse.done || !questionResponse.question) {
                Logger.log(`Breaking loop: done=${questionResponse?.done}, reason=${questionResponse?.reason}`);
                break;
            }

            // Ask question in panel
            const result = await this.askQuestionInPanel(
                panel,
                questionResponse.question,
                ctx.currentIndex + 1,
                this.questionEngine.canGoBack(ctx),
                token
            );

            if (result === null) {
                Logger.log('User cancelled');
                return null;
            }

            if (result === '__BACK__') {
                if (this.questionEngine.goBack(ctx)) {
                    safePostMessage(panel, { type: ExtensionMessage.REMOVE_LAST_QA });
                }
                continue;
            }

            // Store answer
            this.questionEngine.storeAnswer(ctx, questionResponse.question.text, result);

            // Update panel
            safePostMessage(panel, {
                type: ExtensionMessage.QUESTION_ANSWERED,
                questionNum: ctx.currentIndex + 1,
                question: questionResponse.question.text,
                answer: result
            });

            this.questionEngine.advance(ctx);
        }

        Logger.log(`Question loop finished. Collected ${ctx.answers.length} answers`);
        safePostMessage(panel, { type: ExtensionMessage.GENERATING });

        return ctx.answers;
    }

    // ============================================================
    // Plan Confirmation Loop
    // ============================================================

    /**
     * Runs the plan confirmation loop
     * Returns the final plan or null if cancelled
     */
    private async runPlanConfirmationLoop(
        panel: vscode.WebviewPanel,
        cleanRequest: string,
        fullContext: string,
        collectedAnswers: QuestionContext['answers'],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string | null> {
        Logger.log('Step 4: Generating refined prompt...');

        let refinedPrompt = await this.planGenerator.generate(
            cleanRequest,
            fullContext,
            collectedAnswers,
            toolInvocationToken,
            token
        );

        Logger.log(`Refined prompt length: ${refinedPrompt.length}`);
        Logger.log('Step 5: Plan confirmation loop...');

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
                return null;
            }

            if (confirmResult.type === 'approve') {
                return refinedPrompt;
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

        return null;
    }

    // ============================================================
    // Panel Interaction Methods
    // ============================================================

    /**
     * Sends a question to the panel and waits for the answer
     */
    private askQuestionInPanel(
        panel: vscode.WebviewPanel,
        question: Question,
        questionNum: number,
        canGoBack: boolean,
        token: vscode.CancellationToken
    ): Promise<string | null> {
        Logger.log(`askQuestionInPanel: Q${questionNum}, canGoBack=${canGoBack}`);

        const handlers: MessageHandler<string | null>[] = [
            {
                type: WebviewMessage.ANSWER,
                handle: (msg: WebviewIncomingMessage) => isAnswerMessage(msg) ? msg.answer : undefined,
            },
            {
                type: WebviewMessage.BACK,
                handle: () => '__BACK__',
            },
            {
                type: WebviewMessage.CANCEL,
                handle: () => null,
            },
        ];

        return createPanelPromise(panel, handlers, token, () => {
            Logger.log('Posting newQuestion message to Webview');
            safePostMessage(panel, {
                type: ExtensionMessage.NEW_QUESTION,
                questionNum,
                question,
                canGoBack
            });
        });
    }

    /**
     * Shows plan confirmation dialog and waits for user response
     */
    private showPlanConfirmation(
        panel: vscode.WebviewPanel,
        plan: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<ConfirmResult | null> {
        Logger.log('showPlanConfirmation');

        // State for plan display
        interface PlanDisplayState {
            content: string;
            isTranslated: boolean;
        }

        const state: PlanDisplayState = { content: plan, isTranslated: false };

        const sendPlan = () => {
            safePostMessage(panel, {
                type: ExtensionMessage.SHOW_PLAN,
                plan: state.content,
                isTranslated: state.isTranslated
            });
        };

        const handlers: MessageHandler<ConfirmResult | null>[] = [
            {
                type: WebviewMessage.APPROVE_PLAN,
                handle: () => ({ type: 'approve' as const }),
            },
            {
                type: WebviewMessage.REVISE_PLAN,
                handle: (msg: WebviewIncomingMessage) => isReviseMessage(msg)
                    ? { type: 'revise' as const, feedback: msg.feedback }
                    : undefined,
            },
            {
                type: WebviewMessage.TRANSLATE_PLAN,
                handle: async (msg: WebviewIncomingMessage) => {
                    if (!isTranslateMessage(msg)) return undefined;

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
                    return undefined; // Don't resolve - continue waiting
                },
            },
            {
                type: WebviewMessage.SHOW_ORIGINAL,
                handle: () => {
                    state.content = plan;
                    state.isTranslated = false;
                    sendPlan();
                    return undefined; // Don't resolve - continue waiting
                },
            },
            {
                type: WebviewMessage.CANCEL,
                handle: () => null,
            },
        ];

        return createPanelPromise(panel, handlers, token, sendPlan);
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    /**
     * Cleans the user request by removing tool name prefixes
     */
    private cleanUserRequest(request: string): string {
        return request
            .replace(/^#?plan\s*/i, '')
            .replace(/^['"]plan['"]\s*/i, '')
            .trim();
    }

    /**
     * Creates a cancelled result
     */
    private createCancelledResult(): vscode.LanguageModelToolResult {
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('User cancelled the planning process.')
        ]);
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<PlanToolInput>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { userRequest } = options.input;
        return {
            invocationMessage: `Planning: "${userRequest.substring(0, 50)}${userRequest.length > 50 ? '...' : ''}"`,
        };
    }
}

// ============================================================
// Extension Activation
// ============================================================

export function activate(context: vscode.ExtensionContext) {
    Logger.log('Extension activated');
    const tool = new TaskPlannerTool();
    context.subscriptions.push(vscode.lm.registerTool(Config.TOOL_NAMES.PLAN, tool));
}

export function deactivate() {
    Logger.log('Extension deactivated');
}
