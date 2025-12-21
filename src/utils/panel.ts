import * as vscode from 'vscode';
import { MessageHandler } from '../types/messages';

/**
 * Webview panel utility functions
 */

/**
 * Safely post a message to a webview panel.
 * Returns false if the panel is disposed or posting fails.
 *
 * @param panel - The webview panel to post to
 * @param message - The message to post
 * @returns true if successful, false otherwise
 */
export function safePostMessage(panel: vscode.WebviewPanel, message: unknown): boolean {
    try {
        panel.webview.postMessage(message);
        return true;
    } catch (error) {
        // Panel is likely disposed
        console.log('[TaskPlanner] Failed to post message (panel may be disposed):', error);
        return false;
    }
}

/**
 * Creates a Promise that listens to Webview messages and resolves based on handlers.
 * Automatically handles disposal and cancellation.
 *
 * @param panel - The webview panel to listen to
 * @param handlers - Array of message handlers
 * @param token - Cancellation token
 * @param onSetup - Optional callback to run after setting up listeners
 * @returns Promise that resolves with the handler result or null
 */
export function createPanelPromise<T>(
    panel: vscode.WebviewPanel,
    handlers: MessageHandler<T | null>[],
    token: vscode.CancellationToken,
    onSetup?: () => void
): Promise<T | null> {
    return new Promise((resolve) => {
        let resolved = false;
        const disposables: vscode.Disposable[] = [];

        const disposeAll = () => {
            disposables.forEach(d => d.dispose());
            disposables.length = 0;
        };

        const safeResolve = (value: T | null) => {
            if (!resolved) {
                resolved = true;
                disposeAll();
                resolve(value);
            }
        };

        // Call setup callback if provided
        if (onSetup) {
            onSetup();
        }

        // Listen for messages
        const messageDisposable = panel.webview.onDidReceiveMessage(async (message: Record<string, unknown>) => {
            console.log(`[TaskPlanner] Received message: ${JSON.stringify(message)}`);

            for (const handler of handlers) {
                if (message.type === handler.type) {
                    const result = await handler.handle(message);
                    if (result !== undefined) {
                        safeResolve(result);
                        return;
                    }
                }
            }
        });
        disposables.push(messageDisposable);

        // Handle panel disposal
        const panelDisposable = panel.onDidDispose(() => {
            console.log('[TaskPlanner] Panel disposed while waiting');
            safeResolve(null);
        });
        disposables.push(panelDisposable);

        // Handle cancellation
        const tokenDisposable = token.onCancellationRequested(() => {
            console.log('[TaskPlanner] Cancellation requested');
            safeResolve(null);
        });
        disposables.push(tokenDisposable);
    });
}
