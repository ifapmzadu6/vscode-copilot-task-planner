import * as vscode from 'vscode';

/**
 * Utility functions for managing disposable resources
 */

/**
 * Disposes all disposables in the array and clears it.
 * Safely handles empty arrays and already-disposed items.
 *
 * @param disposables - Array of disposables to dispose
 */
export function disposeAll(disposables: vscode.Disposable[]): void {
    for (const d of disposables) {
        d.dispose();
    }
    disposables.length = 0;
}
