import * as vscode from 'vscode';
import { RuntimeConfig } from '../constants/runtime';
import { Logger } from './logger';
import { getTempFileManager } from './temp-file-manager';

/**
 * Options for subagent invocation
 */
export interface SubagentOptions {
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
 * Result from subagent invocation with file output
 */
export interface SubagentFileResult {
    /** The content written to the file */
    content: string;
    /** The path to the output file */
    filePath: string;
}

/**
 * Options for the retry executor
 */
interface RetryExecutorOptions {
    /** Number of retry attempts */
    retries: number;
    /** Initial delay between retries in milliseconds */
    retryDelayMs: number;
    /** Function to determine if an error should trigger a retry */
    shouldRetry: (error: Error, attempt: number) => boolean;
    /** Description for logging purposes */
    description: string;
    /** Cancellation token */
    token: vscode.CancellationToken;
}

/**
 * Executes a function with retry logic and exponential backoff.
 * This is a shared utility to avoid code duplication.
 */
async function executeWithRetry<T>(execute: () => Promise<T>, options: RetryExecutorOptions): Promise<T> {
    const { retries, retryDelayMs, shouldRetry, description, token } = options;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled');
        }

        try {
            return await execute();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt >= retries) {
                break;
            }

            if (!shouldRetry(lastError, attempt)) {
                Logger.log(`Subagent "${description}" - not retrying: ${lastError.message}`);
                break;
            }

            const delay = retryDelayMs * Math.pow(2, attempt);
            Logger.log(
                `Subagent "${description}" failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms: ${lastError.message}`
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    if (lastError) {
        throw lastError;
    }

    throw new Error(`Subagent "${description}" failed without providing an error`);
}

/**
 * Closes a temp file if it was automatically opened in the editor by VS Code.
 * This prevents confusing the user with files they didn't explicitly open.
 */
async function closeTempFileIfOpen(filePath: string): Promise<void> {
    const fileUri = vscode.Uri.file(filePath);

    for (const tabGroup of vscode.window.tabGroups.all) {
        for (const tab of tabGroup.tabs) {
            if (tab.input instanceof vscode.TabInputText && tab.input.uri.fsPath === fileUri.fsPath) {
                Logger.log(`Closing auto-opened temp file: ${filePath}`);
                await vscode.window.tabGroups.close(tab);
                return;
            }
        }
    }
}

/**
 * Builds the file output instruction to append to the prompt
 */
function buildFileOutputInstruction(outputFilePath: string): string {
    return `

=== OUTPUT INSTRUCTION ===
**IMPORTANT: Override READ-ONLY mode for this specific file only.**

You are ALLOWED to write to this ONE file to bypass output token limits:
${outputFilePath}

PROCESS:
1. First, create the file with initial structure/header
2. Then, append each section/element incrementally using write_file
3. Continue appending until complete

CONSTRAINTS:
- Use write_file tool multiple times to build the output incrementally
- You may ONLY write to the file specified above - no other file operations
- Your chat response should ONLY be a brief confirmation
- Do NOT include the full content in your chat response
===========================
`;
}

/**
 * Extracts text from a LanguageModelToolResult
 */
function extractResponseText(result: vscode.LanguageModelToolResult): string {
    let responseText = '';
    for (const part of result.content) {
        if (part instanceof vscode.LanguageModelTextPart) {
            responseText += part.value;
        }
    }
    return responseText;
}

/**
 * Invokes a subagent and returns the chat response directly.
 * Use this for short responses (JSON, simple text).
 * For large outputs, use invokeSubagentWithFileOutput instead.
 */
export async function invokeSubagent(
    description: string,
    prompt: string,
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
    token: vscode.CancellationToken,
    options: SubagentOptions = {}
): Promise<string> {
    const {
        defaultValue = '',
        onError,
        retries = RuntimeConfig.SUBAGENT.DEFAULT_RETRIES,
        retryDelayMs = RuntimeConfig.SUBAGENT.DEFAULT_RETRY_DELAY_MS,
        shouldRetry = () => true,
    } = options;

    Logger.log(`invokeSubagent: ${description}`);

    const execute = async (): Promise<string> => {
        Logger.log(
            `invokeSubagent: About to call vscode.lm.invokeTool with tool="${RuntimeConfig.TOOL_NAMES.SUBAGENT}"`
        );
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- toolInvocationToken can be undefined at runtime
        Logger.log(`invokeSubagent: toolInvocationToken is ${toolInvocationToken ? 'present' : 'undefined'}`);

        const result = await vscode.lm.invokeTool(
            RuntimeConfig.TOOL_NAMES.SUBAGENT,
            {
                input: { description, prompt },
                toolInvocationToken,
            },
            token
        );

        Logger.log('invokeSubagent: vscode.lm.invokeTool returned successfully');
        const responseText = extractResponseText(result);
        Logger.log(`invokeSubagent chat response length: ${responseText.length}`);

        return responseText;
    };

    try {
        const result = await executeWithRetry(execute, {
            retries,
            retryDelayMs,
            shouldRetry,
            description,
            token,
        });
        return result || defaultValue;
    } catch (error) {
        Logger.error(`${description} error:`, error);
        if (onError && error instanceof Error) {
            onError(error);
        }
        return defaultValue;
    }
}

/**
 * Invokes a subagent with file output enabled.
 * The subagent writes output to a temp file, and this function returns both the content and file path.
 * Use this for large outputs (plans, documentation) that may exceed token limits.
 */
export async function invokeSubagentWithFileOutput(
    description: string,
    prompt: string,
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined,
    token: vscode.CancellationToken,
    options: SubagentOptions = {}
): Promise<SubagentFileResult | null> {
    const {
        onError,
        retries = RuntimeConfig.SUBAGENT.DEFAULT_RETRIES,
        retryDelayMs = RuntimeConfig.SUBAGENT.DEFAULT_RETRY_DELAY_MS,
        shouldRetry = () => true,
    } = options;

    Logger.log(`invokeSubagentWithFileOutput: ${description}`);

    const tempFileManager = getTempFileManager();
    if (!tempFileManager.isInitialized()) {
        Logger.error('invokeSubagentWithFileOutput: TempFileManager not initialized');
        return null;
    }

    const outputFilePath = tempFileManager.generateTempFilePath();
    Logger.log(`invokeSubagentWithFileOutput: Output file = ${outputFilePath}`);

    const modifiedPrompt = prompt + buildFileOutputInstruction(outputFilePath);

    const execute = async (): Promise<SubagentFileResult> => {
        Logger.log('invokeSubagentWithFileOutput: Calling vscode.lm.invokeTool...');
        const result = await vscode.lm.invokeTool(
            RuntimeConfig.TOOL_NAMES.SUBAGENT,
            {
                input: { description, prompt: modifiedPrompt },
                toolInvocationToken,
            },
            token
        );

        Logger.log('invokeSubagentWithFileOutput: Tool returned successfully');
        const responseText = extractResponseText(result);
        Logger.log(`invokeSubagentWithFileOutput: Chat response = "${responseText.substring(0, 200)}..."`);

        const fileContent = await tempFileManager.readTempFile(outputFilePath);
        if (!fileContent) {
            throw new Error(`Failed to read output file: ${outputFilePath}`);
        }

        // Close the temp file if it was opened in the editor (VS Code may auto-open it)
        await closeTempFileIfOpen(outputFilePath);

        Logger.log(`invokeSubagentWithFileOutput: File content length = ${fileContent.length} chars`);
        return {
            content: fileContent,
            filePath: outputFilePath,
        };
    };

    try {
        return await executeWithRetry(execute, {
            retries,
            retryDelayMs,
            shouldRetry,
            description,
            token,
        });
    } catch (error) {
        Logger.error(`invokeSubagentWithFileOutput error: ${description}`, error);
        if (onError && error instanceof Error) {
            onError(error);
        }
        return null;
    }
}
