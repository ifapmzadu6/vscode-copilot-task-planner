import { Config } from '../constants/config';
import { Logger } from './logger';

/**
 * JSON parsing utilities with retry logic and error recovery
 */

/**
 * Common JSON fixes to apply when parsing fails
 */
const JSON_FIXES: Array<{
    name: string;
    fix: (json: string) => string;
}> = [
    {
        name: 'trailing commas',
        fix: (json) => json
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
    },
    {
        name: 'single quotes to double quotes',
        fix: (json) => json.replace(/'/g, '"')
    },
    {
        name: 'unquoted keys',
        fix: (json) => json.replace(
            /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
            '$1"$2":'
        )
    },
    {
        name: 'control characters',
        fix: (json) => json.replace(/[\x00-\x1F\x7F]/g, (char) => {
            if (char === '\n') return '\\n';
            if (char === '\r') return '\\r';
            if (char === '\t') return '\\t';
            return '';
        })
    },
    {
        name: 'trailing text after JSON',
        fix: (json) => {
            // Find the position of the last closing brace and trim after it
            let depth = 0;
            let lastClosingBrace = -1;
            for (let i = 0; i < json.length; i++) {
                if (json[i] === '{') depth++;
                else if (json[i] === '}') {
                    depth--;
                    if (depth === 0) {
                        lastClosingBrace = i;
                        break;
                    }
                }
            }
            return lastClosingBrace >= 0 ? json.substring(0, lastClosingBrace + 1) : json;
        }
    }
];

/**
 * Attempts to fix common JSON issues
 *
 * @param jsonStr - The malformed JSON string
 * @returns The fixed JSON string
 */
function tryFixJson(jsonStr: string): string {
    let fixed = jsonStr;
    for (const { name, fix } of JSON_FIXES) {
        const before = fixed;
        fixed = fix(fixed);
        if (before !== fixed) {
            Logger.log(`Applied JSON fix: ${name}`);
        }
    }
    return fixed;
}

/**
 * Attempts to parse JSON from a response string with retry logic.
 * Tries to extract JSON object from the response and parse it.
 *
 * @param response - The raw response string
 * @param validator - Optional function to validate the parsed object
 * @returns The parsed object or null if parsing fails after retries
 */
export function parseJsonWithRetry<T>(
    response: string,
    validator?: (obj: unknown) => obj is T
): T | null {
    // Try to find JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        Logger.log('Could not find JSON in response');
        return null;
    }

    let jsonStr = jsonMatch[0];

    for (let attempt = 0; attempt < Config.MAX_JSON_PARSE_RETRIES; attempt++) {
        try {
            const parsed = JSON.parse(jsonStr);

            // Validate if validator is provided
            if (validator && !validator(parsed)) {
                Logger.log(`JSON validation failed on attempt ${attempt + 1}`);
                continue;
            }

            return parsed as T;
        } catch (error) {
            Logger.log(`JSON parse error on attempt ${attempt + 1}: ${error instanceof Error ? error.message : 'Unknown'}`);

            // Apply fixes and retry
            if (attempt < Config.MAX_JSON_PARSE_RETRIES - 1) {
                jsonStr = tryFixJson(jsonStr);
            }
        }
    }

    // Final attempt with all fixes applied
    try {
        const fixed = tryFixJson(jsonStr);
        const parsed = JSON.parse(fixed);
        if (!validator || validator(parsed)) {
            Logger.log('Successfully parsed JSON after applying fixes');
            return parsed as T;
        }
    } catch {
        // Give up
    }

    Logger.log('Failed to parse JSON after all retries');
    return null;
}
