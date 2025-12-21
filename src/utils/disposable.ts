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
    disposables.forEach(d => d.dispose());
    disposables.length = 0;
}

/**
 * Creates a disposable that runs a callback when disposed.
 * Useful for cleanup operations.
 *
 * @param callback - Function to run on disposal
 * @returns A disposable that runs the callback
 */
export function createDisposable(callback: () => void): vscode.Disposable {
    return { dispose: callback };
}
