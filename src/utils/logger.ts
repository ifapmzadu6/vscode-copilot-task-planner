import * as vscode from 'vscode';
import { RuntimeConfig } from '../constants/runtime';

const LOG_PREFIX = RuntimeConfig.LOGGING.PREFIX;

/**
 * Cached debug mode flag for efficient checking.
 * Set during extension activation.
 */
let isDebugMode = false;

/**
 * Initializes the logger with the extension context.
 * Call this during extension activation.
 */
export function initializeLogger(context: vscode.ExtensionContext): void {
    isDebugMode = context.extensionMode === vscode.ExtensionMode.Development;
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
        if (isDebugMode) {
            console.debug(`${LOG_PREFIX} [DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Returns whether debug mode is enabled.
     * Useful for conditional logic that should only run in development.
     */
    isDebugEnabled(): boolean {
        return isDebugMode;
    },
} as const;
