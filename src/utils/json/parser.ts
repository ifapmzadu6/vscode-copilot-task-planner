import { RuntimeConfig } from '../../constants/runtime';
import { Logger } from '../logger';
import { tryFixJson } from './fixes';

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

    for (let attempt = 0; attempt < RuntimeConfig.MAX_JSON_PARSE_RETRIES; attempt++) {
        try {
            const parsed: unknown = JSON.parse(jsonStr);

            // Validate if validator is provided
            if (validator && !validator(parsed)) {
                Logger.log(`JSON validation failed on attempt ${attempt + 1}`);
                continue;
            }

            return parsed as T;
        } catch (error) {
            Logger.log(`JSON parse error on attempt ${attempt + 1}: ${error instanceof Error ? error.message : 'Unknown'}`);

            // Apply fixes and retry
            if (attempt < RuntimeConfig.MAX_JSON_PARSE_RETRIES - 1) {
                jsonStr = tryFixJson(jsonStr);
            }
        }
    }

    // Final attempt with all fixes applied
    try {
        const fixed = tryFixJson(jsonStr);
        const parsed: unknown = JSON.parse(fixed);
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
