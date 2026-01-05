import { RuntimeConfig } from '../../constants/runtime';
import { Logger } from '../logger';
import { tryFixJson } from './fixes';

/**
 * Attempts to parse JSON from a response string with retry logic.
 * Tries to extract JSON object from the response and parse it.
 * On parse failure, applies fixes to the JSON string and retries.
 *
 * @param response - The raw response string
 * @param validator - Optional function to validate the parsed object
 * @returns The parsed object or null if parsing fails after retries
 */
export function parseJsonWithRetry<T>(response: string, validator?: (obj: unknown) => obj is T): T | null {
    // Try to find JSON object in the response
    const jsonMatch = /\{[\s\S]*\}/.exec(response);
    if (!jsonMatch) {
        Logger.log('Could not find JSON in response');
        return null;
    }

    let jsonStr = jsonMatch[0];
    const maxAttempts = RuntimeConfig.MAX_JSON_PARSE_RETRIES;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const parsed: unknown = JSON.parse(jsonStr);

            // Validate if validator is provided
            if (validator && !validator(parsed)) {
                Logger.log(`JSON validation failed on attempt ${attempt}/${maxAttempts}`);
                // Apply fixes for next attempt if validation fails
                if (attempt < maxAttempts) {
                    jsonStr = tryFixJson(jsonStr);
                }
                continue;
            }

            if (attempt > 1) {
                Logger.log(`Successfully parsed JSON after ${attempt} attempts`);
            }
            return parsed as T;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown';
            Logger.log(`JSON parse error on attempt ${attempt}/${maxAttempts}: ${errorMsg}`);

            // Apply fixes for next attempt
            if (attempt < maxAttempts) {
                jsonStr = tryFixJson(jsonStr);
            }
        }
    }

    Logger.log('Failed to parse JSON after all retries');
    return null;
}
