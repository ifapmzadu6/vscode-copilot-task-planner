import * as vscode from 'vscode';
import { RuntimeConfig } from '../constants/runtime';

const LOG_PREFIX = RuntimeConfig.LOGGING.PREFIX;

/**
 * Tracks the current extension mode for debug logging.
 * Set during extension activation.
 */
let extensionMode: vscode.ExtensionMode = vscode.ExtensionMode.Production;

/**
 * Initializes the logger with the extension context.
 * Call this during extension activation.
 */
export function initializeLogger(context: vscode.ExtensionContext): void {
    extensionMode = context.extensionMode;
}

/**
 * Centralized logging utility for the Task Planner extension.
 * Provides consistent log formatting across all modules.
 */
export const Logger = {
    /**
     * Logs an informational message with the TaskPlanner prefix.
     */
    log(message: string, ...args: unknown[]): void {
        console.log(`${LOG_PREFIX} ${message}`, ...args);
    },

    /**
     * Logs an error message with the TaskPlanner prefix.
     */
    error(message: string, error?: unknown): void {
        console.error(`${LOG_PREFIX} ${message}`, error);
    },

    /**
     * Logs a warning message with the TaskPlanner prefix.
     */
    warn(message: string, ...args: unknown[]): void {
        console.warn(`${LOG_PREFIX} ${message}`, ...args);
    },

    /**
     * Logs a debug message with the TaskPlanner prefix.
     * Only outputs in development mode (when running via F5 debugging).
     */
    debug(message: string, ...args: unknown[]): void {
        if (extensionMode === vscode.ExtensionMode.Development) {
            console.debug(`${LOG_PREFIX} [DEBUG] ${message}`, ...args);
        }
    },
} as const;
