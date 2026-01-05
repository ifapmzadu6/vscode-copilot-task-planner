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
 * Uses singleton pattern to prevent duplicate panels.
 */
export class WebviewPanelManager {
    private static existingPanel: vscode.WebviewPanel | null = null;
    private panel: vscode.WebviewPanel | null = null;
    private isDisposed = false;
    private disposables: vscode.Disposable[] = [];

    /**
     * Creates and initializes a new Webview panel, or reveals existing one.
     *
     * @param userRequest - The user's task request to display
     * @returns The created or existing panel
     */
    createPanel(userRequest: string): vscode.WebviewPanel {
        Logger.log('Creating Webview panel...');

        // Reuse existing panel if available
        if (WebviewPanelManager.existingPanel) {
            Logger.log('Reusing existing panel');
            this.panel = WebviewPanelManager.existingPanel;
            this.panel.webview.html = generateBaseHtml(userRequest);
            this.panel.reveal(vscode.ViewColumn.One);
            this.isDisposed = false;
            // Note: disposables are already registered from the original creation
            return this.panel;
        }

        this.panel = vscode.window.createWebviewPanel(UIConfig.PANEL_ID, UIConfig.PANEL_TITLE, vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });

        this.panel.webview.html = generateBaseHtml(userRequest);
        this.isDisposed = false;
        WebviewPanelManager.existingPanel = this.panel;

        // Track disposal - this listener persists for the panel's lifetime
        const disposable = this.panel.onDidDispose(() => {
            Logger.log('Panel disposed');
            this.isDisposed = true;
            WebviewPanelManager.existingPanel = null;
            // Clear disposables since panel is gone
            this.disposables = [];
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
