import * as vscode from 'vscode';
import { Config } from '../constants/config';

/**
 * Error thrown when a subagent invocation times out
 */
export class SubagentTimeoutError extends Error {
    constructor(description: string, timeoutMs: number) {
        super(`Subagent "${description}" timed out after ${timeoutMs}ms`);
        this.name = 'SubagentTimeoutError';
    }
}

/**
 * Logger utility for consistent logging
 */
function log(message: string, ...args: unknown[]): void {
    console.log(`${Config.LOG_PREFIX} ${message}`, ...args);
}

/**
 * Error logger utility
 */
function logError(message: string, error: unknown): void {
    console.error(`${Config.LOG_PREFIX} ${message}`, error);
}

/**
 * Helper function to invoke runSubagent with timeout and extract text result
 *
 * @param description - Short description of the subagent task
 * @param prompt - The prompt to send to the subagent
 * @param toolInvocationToken - The tool invocation token for authorization
 * @param token - Cancellation token
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns The text response from the subagent
 */
export async function invokeSubagent(
    description: string,
    prompt: string,
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
    token: vscode.CancellationToken,
    timeoutMs: number = Config.SUBAGENT_TIMEOUT_MS
): Promise<string> {
    log(`invokeSubagent: ${description}`);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new SubagentTimeoutError(description, timeoutMs));
        }, timeoutMs);
    });

    // Create the actual invocation promise
    const invocationPromise = (async () => {
        const result = await vscode.lm.invokeTool(
            Config.TOOL_NAMES.SUBAGENT,
            {
                input: { description, prompt },
                toolInvocationToken
            },
            token
        );

        let responseText = '';
        for (const part of result.content) {
            if (part instanceof vscode.LanguageModelTextPart) {
                responseText += part.value;
            }
        }
        log(`invokeSubagent result length: ${responseText.length}`);
        return responseText;
    })();

    // Race between invocation and timeout
    return Promise.race([invocationPromise, timeoutPromise]);
}

/**
 * Safely invokes a subagent with error handling and optional default value
 *
 * @param description - Short description of the subagent task
 * @param prompt - The prompt to send to the subagent
 * @param toolInvocationToken - The tool invocation token for authorization
 * @param token - Cancellation token
 * @param options - Additional options
 * @returns The text response from the subagent or default value on error
 */
export async function invokeSubagentSafely(
    description: string,
    prompt: string,
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
    token: vscode.CancellationToken,
    options: {
        defaultValue?: string;
        onError?: (error: Error) => void;
    } = {}
): Promise<string | undefined> {
    try {
        const result = await invokeSubagent(description, prompt, toolInvocationToken, token);
        return result || options.defaultValue;
    } catch (error) {
        logError(`${description} error:`, error);
        if (options.onError && error instanceof Error) {
            options.onError(error);
        }
        return options.defaultValue;
    }
}
