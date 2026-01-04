import * as vscode from 'vscode';
import { UIConfig } from '../../constants/ui';
import { MessageHandler } from '../../types/messages';
import { Logger } from '../logger';
import { disposeAll } from '../disposable';
import { generateBaseHtml } from '../../ui/html-generator';
import { safePostMessage, createPanelPromise } from './messaging';

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

        this.panel = vscode.window.createWebviewPanel(UIConfig.PANEL_ID, UIConfig.PANEL_TITLE, vscode.ViewColumn.One, {
            enableScripts: true,
        });

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
