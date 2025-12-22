import { RuntimeConfig } from '../constants/runtime';

const LOG_PREFIX = RuntimeConfig.LOGGING.PREFIX;

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
     * Only outputs in development mode.
     */
    debug(message: string, ...args: unknown[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`${LOG_PREFIX} [DEBUG] ${message}`, ...args);
        }
    },
} as const;
