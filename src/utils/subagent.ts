import * as vscode from 'vscode';
import { RuntimeConfig } from '../constants/runtime';
import { Logger } from './logger';
import { getTempFileManager } from './temp-file-manager';

/**
 * Error thrown when a subagent invocation times out
 */
class SubagentTimeoutError extends Error {
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
    /** Default value to return when an error occurs */
    defaultValue?: string;
    /** Callback function called when an error occurs */
    onError?: (error: Error) => void;
    /** Number of retry attempts on failure (default: 3) */
    retries?: number;
    /** Initial delay between retries in milliseconds (default: 1000). Uses exponential backoff. */
    retryDelayMs?: number;
    /** Custom function to determine if an error should trigger a retry */
    shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Invokes a subagent with configurable timeout and error handling
 *
 * @param description - Short description of the subagent task
 * @param prompt - The prompt to send to the subagent
 * @param toolInvocationToken - The tool invocation token for authorization
 * @param token - Cancellation token
 * @param options - Additional options for timeout and error handling
 * @returns The text response from the subagent, or defaultValue on error
 */
/**
 * Builds the file output instruction to append to the prompt
 */
function buildFileOutputInstruction(outputFilePath: string): string {
    return `

=== OUTPUT INSTRUCTION ===
To bypass output token limits, write your response incrementally to this file:
${outputFilePath}

PROCESS:
1. First, create the file with initial structure/header
2. Then, append each section/element incrementally using write_file
3. Continue appending until complete

CONSTRAINTS:
- Use write_file tool multiple times to build the output incrementally
- Your chat response should ONLY be a brief confirmation
- Do NOT include the full content in your chat response
===========================
`;
}

export async function invokeSubagent(
    description: string,
    prompt: string,
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
    token: vscode.CancellationToken,
    options: SubagentOptions = {}
): Promise<string> {
    const {
        timeoutMs = RuntimeConfig.SUBAGENT_TIMEOUT_MS,
        defaultValue = '',
        onError,
        retries = 3,
        retryDelayMs = 1000,
        shouldRetry = () => true
    } = options;

    Logger.log(`invokeSubagent: ${description}`);

    // Prepare file output
    const tempFileManager = getTempFileManager();
    const outputFilePath = tempFileManager.isInitialized()
        ? tempFileManager.generateTempFilePath()
        : undefined;
    const modifiedPrompt = outputFilePath
        ? prompt + buildFileOutputInstruction(outputFilePath)
        : prompt;

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
                    input: { description, prompt: modifiedPrompt },
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
            Logger.log(`invokeSubagent chat response length: ${responseText.length}`);

            // If file output was requested, read from file
            if (outputFilePath) {
                const fileContent = await tempFileManager.readTempFile(outputFilePath);
                if (fileContent) {
                    Logger.log(`Read file output: ${fileContent.length} chars`);
                    // Don't delete the file - keep it for Copilot to reference
                    // Append file reference message to the content
                    const fileReferenceMessage = [
                        '',
                        '---',
                        '**Note:** The detailed plan has been written to the file below.',
                        'Please read this file to continue with the implementation.',
                        '',
                        `\`${outputFilePath}\``
                    ].join('\n');
                    return fileContent + fileReferenceMessage;
                }
                // File output is required - throw error if file not found
                throw new Error(`Failed to read output file: ${outputFilePath}`);
            }

            return responseText;
        })();

        // Race between invocation and timeout
        return Promise.race([invocationPromise, timeoutPromise]);
    };

    const executeWithRetry = async (): Promise<string> => {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= retries; attempt++) {
            // Check for cancellation before each attempt
            if (token.isCancellationRequested) {
                throw new Error('Operation cancelled');
            }

            try {
                return await execute();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Don't retry if this was the last attempt
                if (attempt >= retries) {
                    break;
                }

                // Check if we should retry this error
                if (!shouldRetry(lastError, attempt)) {
                    Logger.log(`Subagent "${description}" - not retrying: ${lastError.message}`);
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = retryDelayMs * Math.pow(2, attempt);
                Logger.log(`Subagent "${description}" failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms: ${lastError.message}`);

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        if (lastError) {
            throw lastError;
        }

        throw new Error(`Subagent "${description}" failed without providing an error`);
    };

    try {
        const result = await executeWithRetry();
        return result || defaultValue;
    } catch (error) {
        Logger.error(`${description} error:`, error);
        if (onError && error instanceof Error) {
            onError(error);
        }
        return defaultValue;
    }
}
