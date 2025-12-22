import * as vscode from 'vscode';
import { RuntimeConfig } from '../constants/runtime';
import { Logger } from './logger';

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
 * Options for subagent invocation
 */
export interface SubagentOptions {
    /** Timeout in milliseconds (default: 30000) */
    timeoutMs?: number;
    /** If true, errors are caught and defaultValue is returned instead of throwing */
    safe?: boolean;
    /** Default value to return when safe mode is enabled and an error occurs */
    defaultValue?: string;
    /** Callback function called when an error occurs in safe mode */
    onError?: (error: Error) => void;
}

/**
 * Invokes a subagent with configurable timeout and error handling
 *
 * @param description - Short description of the subagent task
 * @param prompt - The prompt to send to the subagent
 * @param toolInvocationToken - The tool invocation token for authorization
 * @param token - Cancellation token
 * @param options - Additional options for timeout and error handling
 * @returns The text response from the subagent, or defaultValue on error when safe mode is enabled
 */
export async function invokeSubagent(
    description: string,
    prompt: string,
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
    token: vscode.CancellationToken,
    options: SubagentOptions = {}
): Promise<string> {
    const {
        timeoutMs = RuntimeConfig.SUBAGENT_TIMEOUT_MS,
        safe = false,
        defaultValue = '',
        onError
    } = options;

    Logger.log(`invokeSubagent: ${description}`);

    const execute = async (): Promise<string> => {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new SubagentTimeoutError(description, timeoutMs));
            }, timeoutMs);
        });

        // Create the actual invocation promise
        const invocationPromise = (async () => {
            const result = await vscode.lm.invokeTool(
                RuntimeConfig.TOOL_NAMES.SUBAGENT,
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
            Logger.log(`invokeSubagent result length: ${responseText.length}`);
            return responseText;
        })();

        // Race between invocation and timeout
        return Promise.race([invocationPromise, timeoutPromise]);
    };

    if (safe) {
        try {
            const result = await execute();
            return result || defaultValue;
        } catch (error) {
            Logger.error(`${description} error:`, error);
            if (onError && error instanceof Error) {
                onError(error);
            }
            return defaultValue;
        }
    }

    return execute();
}
