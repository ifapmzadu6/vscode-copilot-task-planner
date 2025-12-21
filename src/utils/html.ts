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

/**
 * Unescapes HTML entities back to their original characters.
 *
 * @param html - The HTML string to unescape
 * @returns The unescaped string
 */
export function unescapeHtml(html: string): string {
    return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}
