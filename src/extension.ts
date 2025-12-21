import * as vscode from 'vscode';

// Import types
import {
    PlanToolInput,
    Question,
    CollectedAnswer,
    QuestionResponse,
    ConfirmResult,
    MessageHandler,
    ExtensionMessage,
    WebviewMessage,
    isQuestionResponse,
    isAnswerMessage,
    isReviseMessage,
    isTranslateMessage,
} from './types/messages';

// Import constants
import { Config } from './constants/config';

// Import utilities
import { invokeSubagent, invokeSubagentSafely } from './utils/subagent';
import { parseJsonWithRetry } from './utils/json';
import { safePostMessage, createPanelPromise } from './utils/panel';

// Import prompt templates
import {
    buildAnalyzeWorkspacePrompt,
    buildNextQuestionPrompt,
    buildTranslatePlanPrompt,
    buildRevisePlanPrompt,
    buildRefinedPromptPrompt,
    buildRegisterTasksPrompt,
} from './prompts/templates';

// Import UI generators
import { generateBaseHtml } from './ui/html-generator';

// ============================================================
// Logger Utility
// ============================================================

const log = (message: string, ...args: unknown[]) =>
    console.log(`${Config.LOG_PREFIX} ${message}`, ...args);

const logError = (message: string, error: unknown) =>
    console.error(`${Config.LOG_PREFIX} ${message}`, error);

// ============================================================
// Task Planner Tool
// ============================================================

/**
 * Task Planner Tool
 * Uses runSubagent + single persistent Webview for dynamic interactive question flow
 */
class TaskPlannerTool implements vscode.LanguageModelTool<PlanToolInput> {

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<PlanToolInput>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { userRequest, context } = options.input;
        log(`invoke called with userRequest: ${userRequest}`);

        const cleanRequest = this.cleanUserRequest(userRequest);
        log(`cleanRequest: ${cleanRequest}`);

        let panel: vscode.WebviewPanel | null = null;

        try {
            // Step 1: Analyze workspace context
            const fullContext = await this.runWorkspaceAnalysis(
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
            await this.registerTasksToTodoList(
                refinedPrompt,
                options.toolInvocationToken,
                token
            );

            // Cleanup and return
            panel.dispose();
            log('Returning refined prompt');
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(refinedPrompt)
            ]);

        } catch (error) {
            logError('Error:', error);
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
    // Main Flow Methods
    // ============================================================

    /**
     * Runs workspace analysis phase
     */
    private async runWorkspaceAnalysis(
        cleanRequest: string,
        context: string | undefined,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        log('Step 1: Analyzing workspace context...');

        const workspaceContext = await invokeSubagentSafely(
            'Analyze workspace context',
            buildAnalyzeWorkspacePrompt(cleanRequest),
            toolInvocationToken,
            token
        );

        const fullContext = workspaceContext || context || '';
        log(`Workspace context length: ${fullContext.length}`);
        return fullContext;
    }

    /**
     * Creates the webview panel
     */
    private createWebviewPanel(cleanRequest: string): vscode.WebviewPanel {
        log('Step 2: Creating Webview panel...');

        const panel = vscode.window.createWebviewPanel(
            Config.UI.PANEL_ID,
            Config.UI.PANEL_TITLE,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = generateBaseHtml(cleanRequest);
        log('Webview panel created');
        return panel;
    }

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
    ): Promise<CollectedAnswer[] | null> {
        log('Step 3: Starting question loop...');

        const collectedAnswers: CollectedAnswer[] = [];
        const questionHistory: { question: Question; response: QuestionResponse }[] = [];
        let currentIndex = 0;
        let panelClosed = false;

        panel.onDidDispose(() => {
            log('Panel disposed');
            panelClosed = true;
        });

        while (currentIndex < Config.MAX_QUESTIONS) {
            log(`Question loop iteration ${currentIndex + 1}`);

            if (token.isCancellationRequested || panelClosed) {
                log(token.isCancellationRequested ? 'Cancellation requested' : 'Panel was closed');
                break;
            }

            // Get or generate question
            const questionResponse = await this.getOrGenerateQuestion(
                currentIndex,
                questionHistory,
                collectedAnswers,
                cleanRequest,
                fullContext,
                toolInvocationToken,
                token
            );

            if (!questionResponse || questionResponse.done || !questionResponse.question) {
                log(`Breaking loop: done=${questionResponse?.done}, reason=${questionResponse?.reason}`);
                break;
            }

            // Ask question in panel
            const result = await this.askQuestionInPanel(
                panel,
                questionResponse.question,
                currentIndex + 1,
                currentIndex > 0,
                token
            );

            if (result === null) {
                log('User cancelled');
                return null;
            }

            if (result === '__BACK__') {
                if (currentIndex > 0) {
                    currentIndex--;
                    collectedAnswers.pop();
                    safePostMessage(panel, { type: ExtensionMessage.REMOVE_LAST_QA });
                }
                continue;
            }

            // Store answer
            this.storeAnswer(collectedAnswers, currentIndex, questionResponse.question.text, result);

            // Update panel
            safePostMessage(panel, {
                type: ExtensionMessage.QUESTION_ANSWERED,
                questionNum: currentIndex + 1,
                question: questionResponse.question.text,
                answer: result
            });

            currentIndex++;
        }

        log(`Question loop finished. Collected ${collectedAnswers.length} answers`);
        safePostMessage(panel, { type: ExtensionMessage.GENERATING });

        return collectedAnswers;
    }

    /**
     * Gets a question from cache or generates a new one
     */
    private async getOrGenerateQuestion(
        currentIndex: number,
        questionHistory: { question: Question; response: QuestionResponse }[],
        collectedAnswers: CollectedAnswer[],
        cleanRequest: string,
        fullContext: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<QuestionResponse | null> {
        // Check cache first
        if (currentIndex < questionHistory.length) {
            log('Using cached question');
            return questionHistory[currentIndex].response;
        }

        // Generate new question
        log('Generating new question...');
        const answersForGeneration = collectedAnswers.slice(0, currentIndex);
        const questionResponse = await this.generateNextQuestion(
            cleanRequest,
            fullContext,
            answersForGeneration,
            toolInvocationToken,
            token
        );

        if (questionResponse.question) {
            questionHistory.push({ question: questionResponse.question, response: questionResponse });
            log(`Cached question: ${questionResponse.question.text}`);
        }

        return questionResponse;
    }

    /**
     * Stores or updates an answer at the given index
     */
    private storeAnswer(
        collectedAnswers: CollectedAnswer[],
        index: number,
        question: string,
        answer: string
    ): void {
        const answerObj = { question, answer };
        if (index < collectedAnswers.length) {
            collectedAnswers[index] = answerObj;
        } else {
            collectedAnswers.push(answerObj);
        }
        log(`Stored answer ${index + 1}: ${answer}`);
    }

    /**
     * Runs the plan confirmation loop
     * Returns the final plan or null if cancelled
     */
    private async runPlanConfirmationLoop(
        panel: vscode.WebviewPanel,
        cleanRequest: string,
        fullContext: string,
        collectedAnswers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string | null> {
        log('Step 4: Generating refined prompt...');

        let refinedPrompt = await this.generateRefinedPrompt(
            cleanRequest,
            fullContext,
            collectedAnswers,
            toolInvocationToken,
            token
        );

        log(`Refined prompt length: ${refinedPrompt.length}`);
        log('Step 5: Plan confirmation loop...');

        let panelClosed = false;
        panel.onDidDispose(() => { panelClosed = true; });

        while (!panelClosed && !token.isCancellationRequested) {
            const confirmResult = await this.showPlanConfirmation(
                panel,
                refinedPrompt,
                toolInvocationToken,
                token
            );

            log(`Confirmation result: ${confirmResult?.type}`);

            if (confirmResult === null) {
                return null;
            }

            if (confirmResult.type === 'approve') {
                return refinedPrompt;
            }

            if (confirmResult.type === 'revise' && confirmResult.feedback) {
                log(`Revising plan with feedback: ${confirmResult.feedback}`);
                safePostMessage(panel, { type: ExtensionMessage.REVISING });

                refinedPrompt = await this.revisePlan(
                    refinedPrompt,
                    confirmResult.feedback,
                    toolInvocationToken,
                    token
                );
                log(`Revised prompt length: ${refinedPrompt.length}`);
            }
        }

        return null;
    }

    // ============================================================
    // Subagent Invocation Methods
    // ============================================================

    /**
     * Generates the next question based on collected answers
     */
    private async generateNextQuestion(
        userRequest: string,
        context: string,
        collectedAnswers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<QuestionResponse> {
        const prompt = buildNextQuestionPrompt(userRequest, context, collectedAnswers);
        log('generateNextQuestion prompt sent');

        const response = await invokeSubagent(
            'Generate next question',
            prompt,
            toolInvocationToken,
            token
        );

        log(`generateNextQuestion raw response: ${response.substring(0, 200)}...`);

        const parsed = parseJsonWithRetry<QuestionResponse>(response, isQuestionResponse);
        if (parsed) {
            log(`Parsed response: done=${parsed.done}, question=${parsed.question?.text || 'none'}`);
            return parsed;
        }

        log('Failed to parse response after retries');
        return { done: true, reason: 'Could not parse response' };
    }

    /**
     * Translates the plan to a target language
     */
    private async translatePlan(
        plan: string,
        targetLang: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        log(`Translating plan to ${targetLang}`);
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
     * Revises the plan based on user feedback
     */
    private async revisePlan(
        currentPlan: string,
        feedback: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        const prompt = buildRevisePlanPrompt(currentPlan, feedback);

        const result = await invokeSubagent(
            'Revise plan based on feedback',
            prompt,
            toolInvocationToken,
            token
        );

        return result || currentPlan;
    }

    /**
     * Generates the final refined prompt
     */
    private async generateRefinedPrompt(
        userRequest: string,
        context: string,
        answers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<string> {
        const prompt = buildRefinedPromptPrompt(userRequest, context, answers);

        const result = await invokeSubagent(
            'Generate task prompt',
            prompt,
            toolInvocationToken,
            token
        );

        if (!result) throw new Error('No response');
        return result;
    }

    /**
     * Registers tasks to the manage_todo_list tool via runSubagent
     */
    private async registerTasksToTodoList(
        refinedPrompt: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<void> {
        log('Step 6: Registering tasks to todo list...');

        await invokeSubagentSafely(
            'Register tasks to todo list',
            buildRegisterTasksPrompt(refinedPrompt),
            toolInvocationToken,
            token,
            {
                onError: (error) => {
                    logError('Failed to register tasks to todo list:', error);
                }
            }
        );

        log('Registered tasks to todo list via subagent');
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
        log(`askQuestionInPanel: Q${questionNum}, canGoBack=${canGoBack}`);

        const handlers: MessageHandler<string | null>[] = [
            {
                type: WebviewMessage.ANSWER,
                handle: (msg) => isAnswerMessage(msg) ? msg.answer : null,
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
            log('Posting newQuestion message to Webview');
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
        log('showPlanConfirmation');

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
                handle: (msg) => isReviseMessage(msg)
                    ? { type: 'revise' as const, feedback: msg.feedback }
                    : null,
            },
            {
                type: WebviewMessage.TRANSLATE_PLAN,
                handle: async (msg) => {
                    if (!isTranslateMessage(msg)) return undefined;

                    safePostMessage(panel, { type: ExtensionMessage.TRANSLATING });
                    try {
                        const translated = await this.translatePlan(
                            plan,
                            msg.targetLang,
                            toolInvocationToken,
                            token
                        );
                        state.content = translated;
                        state.isTranslated = true;
                        sendPlan();
                    } catch (error) {
                        logError('Translation error:', error);
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
    log('Extension activated');
    const tool = new TaskPlannerTool();
    context.subscriptions.push(vscode.lm.registerTool(Config.TOOL_NAMES.PLAN, tool));
}

export function deactivate() {
    log('Extension deactivated');
}
