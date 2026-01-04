import { Logger } from '../logger';

/**
 * JSON fix strategy definition
 */
interface JsonFix {
    name: string;
    fix: (json: string) => string;
}

/**
 * Common JSON fixes to apply when parsing fails
 */
const JSON_FIXES: JsonFix[] = [
    {
        name: 'trailing commas',
        fix: (json) => json.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'),
    },
    {
        name: 'single quotes to double quotes',
        fix: (json) => json.replace(/'/g, '"'),
    },
    {
        name: 'unquoted keys',
        fix: (json) => json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'),
    },
    {
        name: 'control characters',
        fix: (json) =>
            json.replace(/[\x00-\x1F\x7F]/g, (char) => {
                if (char === '\n') return '\\n';
                if (char === '\r') return '\\r';
                if (char === '\t') return '\\t';
                return '';
            }),
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
        },
    },
];

/**
 * Attempts to fix common JSON issues
 *
 * @param jsonStr - The malformed JSON string
 * @returns The fixed JSON string
 */
export function tryFixJson(jsonStr: string): string {
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
