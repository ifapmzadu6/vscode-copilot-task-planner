/**
 * HTML utility functions for safe content handling
 */

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * This is the canonical implementation used throughout the extension.
 *
 * @param text - The text to escape
 * @returns The escaped HTML string
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
