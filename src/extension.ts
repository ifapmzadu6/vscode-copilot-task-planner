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
        Logger.log(`invoke called with userRequest: ${userRequest}`);

        const cleanRequest = this.cleanUserRequest(userRequest);
        Logger.log(`cleanRequest: ${cleanRequest}`);

        const webviewManager = new WebviewPanelManager();

        try {
            // Step 1: Analyze workspace context
            Logger.log('Step 1: Analyzing workspace context...');
            const fullContext = await this.workspaceAnalyzer.analyze(
                cleanRequest,
                options.toolInvocationToken,
                token
            );

            // Step 2: Create persistent Webview panel
            Logger.log('Step 2: Creating Webview panel...');
            const panel = webviewManager.createPanel(cleanRequest);

            // Step 3: Run question flow
            Logger.log('Step 3: Running question flow...');
            const questionResult = await this.questionFlow.run({
                panel,
                userRequest: cleanRequest,
                context: fullContext,
                toolInvocationToken: options.toolInvocationToken,
                token
            });

            if (questionResult.cancelled) {
                webviewManager.dispose();
                return this.createCancelledResult();
            }

            // Step 4: Run plan confirmation flow
            Logger.log('Step 4: Running plan confirmation...');
            const planResult = await this.planConfirmation.run({
                panel,
                userRequest: cleanRequest,
                context: fullContext,
                answers: questionResult.answers,
                toolInvocationToken: options.toolInvocationToken,
                token
            });

            if (planResult.cancelled) {
                webviewManager.dispose();
                return this.createCancelledResult();
            }

            // Step 5: Register tasks to todo list
            Logger.log('Step 5: Registering tasks...');
            await this.planConfirmation.registerTasks(
                planResult.plan,
                options.toolInvocationToken,
                token,
                todoToolName
            );

            // Cleanup and return
            webviewManager.dispose();
            Logger.log('Returning refined prompt');
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(planResult.plan)
            ]);

        } catch (error) {
            Logger.error('Error:', error);
            webviewManager.dispose();

            if (error instanceof Error && error.message === 'Cancelled by user') {
                return this.createCancelledResult();
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error during planning: ${errorMessage}`)
            ]);
        }
    }

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

        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(cancelMessage)
        ]);
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
    const tool = new TaskPlannerTool();
    context.subscriptions.push(vscode.lm.registerTool(RuntimeConfig.TOOL_NAMES.PLAN, tool));
}

export function deactivate() {
    Logger.log('Extension deactivated');
}
