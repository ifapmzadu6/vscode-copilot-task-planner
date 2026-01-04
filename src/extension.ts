import * as vscode from 'vscode';

// Import types
import { PlanToolInput } from './types/messages';

// Import constants
import { RuntimeConfig } from './constants/runtime';

// Import services
import { WorkspaceAnalysisService } from './services';

// Import orchestrators
import { QuestionFlowOrchestrator, PlanConfirmationOrchestrator } from './orchestrators';

// Import utilities
import { Logger } from './utils/logger';
import { WebviewPanelManager } from './utils/webview';
import { getTempFileManager } from './utils/temp-file-manager';

// ============================================================
// Task Planner Tool
// ============================================================

/**
 * Task Planner Tool
 * Uses runSubagent + single persistent Webview for dynamic interactive question flow
 */
class TaskPlannerTool implements vscode.LanguageModelTool<PlanToolInput> {
    private readonly workspaceAnalyzer = new WorkspaceAnalysisService();
    private readonly questionFlow = new QuestionFlowOrchestrator();
    private readonly planConfirmation = new PlanConfirmationOrchestrator();

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<PlanToolInput>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { userRequest, todoToolName } = options.input;
        Logger.log('========================================');
        Logger.log('=== Marathon Planner: Tool Invoked ===');
        Logger.log('========================================');
        Logger.log(`Input userRequest: "${userRequest}"`);
        Logger.log(`Input todoToolName: "${todoToolName ?? 'not specified'}"`);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- toolInvocationToken can be undefined at runtime
        Logger.log(`toolInvocationToken: ${options.toolInvocationToken ? 'present' : 'undefined'}`);

        const cleanRequest = this.cleanUserRequest(userRequest);
        Logger.log(`Cleaned request: "${cleanRequest}"`);

        const webviewManager = new WebviewPanelManager();

        try {
            // Step 1: Create persistent Webview panel (show immediately)
            Logger.log('----------------------------------------');
            Logger.log('Step 1: Creating Webview panel...');
            const panel = webviewManager.createPanel(cleanRequest);
            Logger.log('Step 1: Complete - Webview panel created');

            // Step 2: Analyze workspace context
            Logger.log('----------------------------------------');
            Logger.log('Step 2: Analyzing workspace context...');
            const fullContext = await this.workspaceAnalyzer.analyze(cleanRequest, options.toolInvocationToken, token);
            Logger.log(`Step 2: Complete - Context length: ${fullContext.length} chars`);

            // Step 3: Run question flow
            Logger.log('----------------------------------------');
            Logger.log('Step 3: Running question flow...');
            const questionResult = await this.questionFlow.run({
                panel,
                userRequest: cleanRequest,
                context: fullContext,
                toolInvocationToken: options.toolInvocationToken,
                token,
            });
            Logger.log(
                `Step 3: Complete - Cancelled: ${questionResult.cancelled}, Answers count: ${questionResult.answers.length}`
            );

            if (questionResult.cancelled) {
                Logger.log('Step 3: User cancelled during question flow');
                webviewManager.dispose();
                return this.createCancelledResult();
            }

            // Step 4: Run plan confirmation flow
            Logger.log('----------------------------------------');
            Logger.log('Step 4: Running plan confirmation...');
            const planResult = await this.planConfirmation.run({
                panel,
                userRequest: cleanRequest,
                context: fullContext,
                answers: questionResult.answers,
                toolInvocationToken: options.toolInvocationToken,
                token,
            });
            Logger.log(
                `Step 4: Complete - Cancelled: ${planResult.cancelled}, Plan length: ${planResult.plan.length} chars`
            );

            if (planResult.cancelled) {
                Logger.log('Step 4: User cancelled during plan confirmation');
                webviewManager.dispose();
                return this.createCancelledResult();
            }

            // Step 5: Register tasks to todo list
            Logger.log('----------------------------------------');
            Logger.log('Step 5: Registering tasks to todo list...');
            Logger.log(`Step 5: Using todoToolName: "${todoToolName ?? 'default'}"`);
            await this.planConfirmation.registerTasks(
                planResult.plan,
                options.toolInvocationToken,
                token,
                todoToolName
            );
            Logger.log('Step 5: Complete - Task registration finished');

            // Cleanup and return
            Logger.log('----------------------------------------');
            webviewManager.dispose();
            Logger.log('Webview disposed, preparing final result...');
            Logger.log(`Plan file path: ${planResult.planFilePath}`);
            Logger.log(`Plan content length: ${planResult.plan.length} chars`);

            // Build result with clear instruction to proceed without asking
            // Include the FULL plan content directly (not file path) so Copilot can execute
            const resultMessage = [
                '## Plan Approved by User',
                '',
                'The user has already reviewed and approved this plan through the interactive planning interface.',
                '**Do NOT ask for confirmation again.** Proceed directly with executing the plan.',
                '',
                '---',
                '',
                '## Execution Plan',
                '',
                planResult.plan,
            ].join('\n');

            Logger.log(`Final result message length: ${resultMessage.length} chars`);
            Logger.log('========================================');
            Logger.log('=== Marathon Planner: Complete ===');
            Logger.log('========================================');

            return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(resultMessage)]);
        } catch (error) {
            Logger.error('========================================');
            Logger.error('=== Marathon Planner: ERROR ===');
            Logger.error('========================================');
            Logger.error('Error:', error);
            webviewManager.dispose();

            if (error instanceof Error && error.message === 'Cancelled by user') {
                return this.createCancelledResult();
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error during planning: ${errorMessage}`),
            ]);
        }
    }

    /**
     * Cleans the user request by removing tool name prefixes
     */
    private cleanUserRequest(request: string): string {
        return request
            .replace(/^#?(marathonPlanner|marathon|plan)\s*/i, '')
            .replace(/^['"](marathonPlanner|marathon|plan)['"]\s*/i, '')
            .trim();
    }

    /**
     * Creates a cancelled result with clear messaging to stop further processing
     */
    private createCancelledResult(): vscode.LanguageModelToolResult {
        const cancelMessage = [
            '## Planning Cancelled',
            '',
            'The user has cancelled the planning process by closing the planning window.',
            '',
            '**No further action is required.** Please do not proceed with any task execution or planning.',
            'If the user wants to create a plan, they can invoke the planning tool again.',
        ].join('\n');

        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(cancelMessage)]);
    }

    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<PlanToolInput>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
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

    // Initialize TempFileManager (fire-and-forget)
    const tempFileManager = getTempFileManager();
    tempFileManager
        .initialize(context)
        .then(() => {
            tempFileManager.cleanupOldFiles().catch((err: unknown) => {
                Logger.error('Failed to cleanup old temp files', err);
            });
        })
        .catch((err: unknown) => {
            Logger.error('Failed to initialize TempFileManager', err);
        });

    const tool = new TaskPlannerTool();
    context.subscriptions.push(vscode.lm.registerTool(RuntimeConfig.TOOL_NAMES.MARATHON_PLANNER, tool));
}

export function deactivate() {
    Logger.log('Extension deactivated');
}
