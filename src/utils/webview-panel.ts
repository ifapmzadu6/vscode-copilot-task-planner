import * as vscode from 'vscode';
import { Config } from '../constants/config';
import { MessageHandler, WebviewIncomingMessage, isWebviewMessage } from '../types/messages';
import { Logger } from './logger';
import { disposeAll } from './disposable';
import { generateBaseHtml } from '../ui/html-generator';

/**
 * Unified Webview panel management
 * Combines panel lifecycle, messaging, and state management
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
        Logger.log('Failed to post message (panel may be disposed):', error);
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

        const safeResolve = (value: T | null) => {
            if (!resolved) {
                resolved = true;
                disposeAll(disposables);
                resolve(value);
            }
        };

        // Call setup callback if provided
        if (onSetup) {
            onSetup();
        }

        // Listen for messages
        const messageDisposable = panel.webview.onDidReceiveMessage(async (rawMessage: unknown) => {
            // Validate message structure
            if (!isWebviewMessage(rawMessage)) {
                Logger.log(`Received invalid message: ${JSON.stringify(rawMessage)}`);
                return;
            }

            const message: WebviewIncomingMessage = rawMessage;
            Logger.log(`Received message: ${JSON.stringify(message)}`);

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
            Logger.log('Panel disposed while waiting');
            safeResolve(null);
        });
        disposables.push(panelDisposable);

        // Handle cancellation
        const tokenDisposable = token.onCancellationRequested(() => {
            Logger.log('Cancellation requested');
            safeResolve(null);
        });
        disposables.push(tokenDisposable);
    });
}

/**
 * Manages Webview panel lifecycle and state.
 * Provides a clean interface for panel creation, disposal tracking, and messaging.
 */
export class WebviewPanelManager {
    private panel: vscode.WebviewPanel | null = null;
    private isDisposed = false;
    private disposables: vscode.Disposable[] = [];

    /**
     * Creates and initializes a new Webview panel.
     *
     * @param userRequest - The user's task request to display
     * @returns The created panel
     */
    createPanel(userRequest: string): vscode.WebviewPanel {
        Logger.log('Creating Webview panel...');

        this.panel = vscode.window.createWebviewPanel(
            Config.UI.PANEL_ID,
            Config.UI.PANEL_TITLE,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        this.panel.webview.html = generateBaseHtml(userRequest);
        this.isDisposed = false;

        // Track disposal
        const disposable = this.panel.onDidDispose(() => {
            Logger.log('Panel disposed');
            this.isDisposed = true;
        });
        this.disposables.push(disposable);

        Logger.log('Webview panel created');
        return this.panel;
    }

    /**
     * Gets the current panel.
     * @throws Error if panel is not created
     */
    getPanel(): vscode.WebviewPanel {
        if (!this.panel) {
            throw new Error('Panel not created');
        }
        return this.panel;
    }

    /**
     * Checks if the panel is still active (not disposed).
     */
    isActive(): boolean {
        return this.panel !== null && !this.isDisposed;
    }

    /**
     * Safely posts a message to the webview.
     * @param message - The message to post
     * @returns true if successful, false otherwise
     */
    postMessage(message: unknown): boolean {
        if (!this.panel || this.isDisposed) {
            Logger.log('Cannot post message: panel not active');
            return false;
        }
        return safePostMessage(this.panel, message);
    }

    /**
     * Creates a promise that resolves based on message handlers.
     * Convenience method combining panel access with promise creation.
     */
    createPromise<T>(
        handlers: MessageHandler<T | null>[],
        token: vscode.CancellationToken,
        onSetup?: () => void
    ): Promise<T | null> {
        if (!this.panel) {
            throw new Error('Panel not created');
        }
        return createPanelPromise(this.panel, handlers, token, onSetup);
    }

    /**
     * Disposes of the panel and all associated resources.
     */
    dispose(): void {
        disposeAll(this.disposables);

        if (this.panel && !this.isDisposed) {
            this.panel.dispose();
        }

        this.panel = null;
        this.isDisposed = true;
    }
}

// Re-export WebviewManager for backwards compatibility (deprecated)
/** @deprecated Use WebviewPanelManager instead */
export { WebviewPanelManager as WebviewManager };
