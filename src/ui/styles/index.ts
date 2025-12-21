/**
 * Webview styles module
 * Combines all style sections into a single stylesheet
 */

import { generateBaseStyles } from './base';
import { generateComponentStyles } from './components';
import { generateAnimationStyles } from './animations';

/**
 * Generates complete CSS styles for the webview
 */
export function generateStyles(): string {
    return generateBaseStyles() + generateComponentStyles() + generateAnimationStyles();
}
