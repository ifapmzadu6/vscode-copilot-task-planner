import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { invokeSubagent } from '../utils/subagent';
import { parseJsonWithRetry } from '../utils/json';
import { buildNextQuestionPrompt } from '../prompts/templates';
import { Question, CollectedAnswer, QuestionResponse, isQuestionResponse } from '../types/messages';

/** Maximum number of rejected questions to track per question index */
const MAX_REJECTED_PER_INDEX = 3;

/**
 * Manages the state of the question loop.
 */
export interface QuestionContext {
    /** Collected answers from the user */
    answers: CollectedAnswer[];
    /** Cache of generated questions and responses */
    history: { question: Question; response: QuestionResponse }[];
    /** Current question index */
    currentIndex: number;
    /** Questions that were rejected by the user, keyed by question index */
    rejectedQuestionsMap: Map<number, string[]>;
}

/**
 * Service for generating and managing clarifying questions.
 */
export class QuestionGeneratorService {
    /**
     * Creates a new question context.
     * @returns A fresh question context
     */
    createContext(): QuestionContext {
        return {
            answers: [],
            history: [],
            currentIndex: 0,
            rejectedQuestionsMap: new Map(),
        };
    }

    /**
     * Gets the next question, either from cache or by generating a new one.
     *
     * @param ctx - The question context
     * @param userRequest - The cleaned user request
     * @param fullContext - The workspace context
     * @param toolInvocationToken - Token for subagent authorization
     * @param token - Cancellation token
     * @returns The question response or null if generation fails
     */
    async getOrGenerateQuestion(
        ctx: QuestionContext,
        userRequest: string,
        fullContext: string,
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<QuestionResponse | null> {
        // Check cache first
        if (ctx.currentIndex < ctx.history.length) {
            Logger.log('Using cached question');
            return ctx.history[ctx.currentIndex].response;
        }

        // Generate new question
        Logger.log('Generating new question...');
        const answersForGeneration = ctx.answers.slice(0, ctx.currentIndex);
        const rejectedForCurrentIndex = ctx.rejectedQuestionsMap.get(ctx.currentIndex) ?? [];
        const questionResponse = await this.generateNextQuestion(
            userRequest,
            fullContext,
            answersForGeneration,
            rejectedForCurrentIndex,
            toolInvocationToken,
            token
        );

        if (questionResponse.question) {
            ctx.history.push({ question: questionResponse.question, response: questionResponse });
            Logger.log(`Cached question: ${questionResponse.question.text}`);
        }

        return questionResponse;
    }

    /**
     * Stores an answer in the context.
     *
     * @param ctx - The question context
     * @param question - The question text
     * @param answer - The user's answer
     */
    storeAnswer(ctx: QuestionContext, question: string, answer: string): void {
        const answerObj = { question, answer };
        if (ctx.currentIndex < ctx.answers.length) {
            ctx.answers[ctx.currentIndex] = answerObj;
        } else {
            ctx.answers.push(answerObj);
        }
        Logger.log(`Stored answer ${ctx.currentIndex + 1}: ${answer}`);
    }

    /**
     * Moves to the next question.
     * @param ctx - The question context
     */
    advance(ctx: QuestionContext): void {
        ctx.currentIndex++;
    }

    /**
     * Goes back to the previous question.
     * @param ctx - The question context
     * @returns true if successfully went back, false if already at the first question
     */
    goBack(ctx: QuestionContext): boolean {
        if (ctx.currentIndex > 0) {
            ctx.currentIndex--;
            ctx.answers.pop();
            ctx.history.pop();
            return true;
        }
        return false;
    }

    /**
     * Checks if there are previous questions to go back to.
     * @param ctx - The question context
     * @returns true if can go back
     */
    canGoBack(ctx: QuestionContext): boolean {
        return ctx.currentIndex > 0;
    }

    /**
     * Clears the current question from cache to force regeneration.
     * Records the rejected question so it won't be generated again.
     * @param ctx - The question context
     */
    clearCurrentQuestion(ctx: QuestionContext): void {
        // Record the rejected question before removing it
        if (ctx.currentIndex < ctx.history.length) {
            const rejectedQuestion = ctx.history[ctx.currentIndex].question.text;

            // Get or create the rejected list for this index
            const rejectedList = ctx.rejectedQuestionsMap.get(ctx.currentIndex) ?? [];
            rejectedList.push(rejectedQuestion);

            // Limit to most recent rejections to prevent prompt bloat
            if (rejectedList.length > MAX_REJECTED_PER_INDEX) {
                rejectedList.shift();
            }

            ctx.rejectedQuestionsMap.set(ctx.currentIndex, rejectedList);
            ctx.history.splice(ctx.currentIndex, 1);
            Logger.log(
                `Cleared and recorded rejected question at index ${ctx.currentIndex}: "${rejectedQuestion}" (total rejected for this index: ${rejectedList.length})`
            );
        }
    }

    /**
     * Generates the next question using the subagent.
     */
    private async generateNextQuestion(
        userRequest: string,
        context: string,
        collectedAnswers: CollectedAnswer[],
        rejectedQuestions: string[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<QuestionResponse> {
        const prompt = buildNextQuestionPrompt(userRequest, context, collectedAnswers, rejectedQuestions);
        Logger.log('generateNextQuestion prompt sent');

        let response = '';
        try {
            response = await invokeSubagent('Generate next question', prompt, toolInvocationToken, token);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Logger.error('generateNextQuestion failed:', error);
            return { done: true, reason: errorMessage };
        }

        Logger.log(`generateNextQuestion raw response: ${response.substring(0, 200)}...`);

        const parsed = parseJsonWithRetry<QuestionResponse>(response, isQuestionResponse);
        if (parsed) {
            Logger.log(`Parsed response: done=${parsed.done}, question=${parsed.question?.text ?? 'none'}`);
            return parsed;
        }

        Logger.log('Failed to parse response after retries');
        return { done: true, reason: 'Could not parse response' };
    }
}
