import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { invokeSubagent } from '../utils/subagent';
import { parseJsonWithRetry } from '../utils/json';
import { buildNextQuestionPrompt } from '../prompts/templates';
import { Question, CollectedAnswer, QuestionResponse, isQuestionResponse } from '../types/messages';

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
        const questionResponse = await this.generateNextQuestion(
            userRequest,
            fullContext,
            answersForGeneration,
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
     * Generates the next question using the subagent.
     */
    private async generateNextQuestion(
        userRequest: string,
        context: string,
        collectedAnswers: CollectedAnswer[],
        toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
        token: vscode.CancellationToken
    ): Promise<QuestionResponse> {
        const prompt = buildNextQuestionPrompt(userRequest, context, collectedAnswers);
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
