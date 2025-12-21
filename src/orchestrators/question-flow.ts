import * as vscode from 'vscode';
import { Config } from '../constants/config';
import { Logger } from '../utils/logger';
import { safePostMessage, createPanelPromise } from '../utils/webview-panel';
import { MessageHandlerBuilder } from '../utils/message-handler-builder';
import { QuestionEngine, QuestionContext } from '../services';
import {
    Question,
    CollectedAnswer,
    ExtensionMessage,
    WebviewMessage,
    isAnswerMessage,
} from '../types/messages';

/**
 * Result of the question flow
 */
export interface QuestionFlowResult {
    /** Whether the flow was cancelled */
    cancelled: boolean;
    /** Collected answers (empty if cancelled) */
    answers: CollectedAnswer[];
}

/**
 * Options for running the question flow
 */
export interface QuestionFlowOptions {
    panel: vscode.WebviewPanel;
    userRequest: string;
    context: string;
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined;
    token: vscode.CancellationToken;
}

/**
 * Orchestrates the question flow phase of task planning.
 * Manages the iterative Q&A process with back navigation support.
 */
export class QuestionFlowOrchestrator {
    private readonly questionEngine: QuestionEngine;

    constructor(questionEngine?: QuestionEngine) {
        this.questionEngine = questionEngine ?? new QuestionEngine();
    }

    /**
     * Runs the complete question flow.
     *
     * @param options - Flow options including panel, request, context, and tokens
     * @returns Result containing collected answers or cancellation status
     */
    async run(options: QuestionFlowOptions): Promise<QuestionFlowResult> {
        const { panel, userRequest, context, toolInvocationToken, token } = options;

        Logger.log('Starting question flow...');
        const ctx = this.questionEngine.createContext();
        let panelClosed = false;

        panel.onDidDispose(() => {
            Logger.log('Panel disposed during question flow');
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
                userRequest,
                context,
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
                Logger.log('User cancelled question flow');
                return { cancelled: true, answers: [] };
            }

            if (result === '__BACK__') {
                if (this.questionEngine.goBack(ctx)) {
                    safePostMessage(panel, { type: ExtensionMessage.REMOVE_LAST_QA });
                }
                continue;
            }

            // Store answer and update panel
            this.questionEngine.storeAnswer(ctx, questionResponse.question.text, result);
            this.notifyQuestionAnswered(panel, ctx, questionResponse.question.text, result);
            this.questionEngine.advance(ctx);
        }

        Logger.log(`Question flow finished. Collected ${ctx.answers.length} answers`);
        safePostMessage(panel, { type: ExtensionMessage.GENERATING });

        return { cancelled: false, answers: ctx.answers };
    }

    /**
     * Sends a question to the panel and waits for the answer.
     */
    private askQuestionInPanel(
        panel: vscode.WebviewPanel,
        question: Question,
        questionNum: number,
        canGoBack: boolean,
        token: vscode.CancellationToken
    ): Promise<string | null> {
        Logger.log(`askQuestionInPanel: Q${questionNum}, canGoBack=${canGoBack}`);

        const handlers = new MessageHandlerBuilder<string | null>()
            .on(WebviewMessage.ANSWER, (msg) =>
                isAnswerMessage(msg) ? msg.answer : undefined
            )
            .onReturn(WebviewMessage.BACK, '__BACK__')
            .onReturn(WebviewMessage.CANCEL, null)
            .build();

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
     * Notifies the panel that a question was answered.
     */
    private notifyQuestionAnswered(
        panel: vscode.WebviewPanel,
        ctx: QuestionContext,
        questionText: string,
        answer: string
    ): void {
        safePostMessage(panel, {
            type: ExtensionMessage.QUESTION_ANSWERED,
            questionNum: ctx.currentIndex + 1,
            question: questionText,
            answer
        });
    }
}
