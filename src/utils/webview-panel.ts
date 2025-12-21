/**
 * Re-exports from the webview utilities module.
 * This file maintains backwards compatibility with existing imports.
 */

export { safePostMessage, createPanelPromise } from './webview/messaging';
export { WebviewPanelManager } from './webview/panel-manager';

// Backwards compatibility alias
/** @deprecated Use WebviewPanelManager instead */
export { WebviewPanelManager as WebviewManager } from './webview/panel-manager';
