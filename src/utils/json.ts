import { Config } from '../constants/config';

/**
 * JSON parsing utilities with retry logic
 */

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
        console.log('[TaskPlanner] Could not find JSON in response');
        return null;
    }

    const jsonStr = jsonMatch[0];

    for (let attempt = 0; attempt < Config.MAX_JSON_PARSE_RETRIES; attempt++) {
        try {
            const parsed = JSON.parse(jsonStr);

            // Validate if validator is provided
            if (validator && !validator(parsed)) {
                console.log(`[TaskPlanner] JSON validation failed on attempt ${attempt + 1}`);
                continue;
            }

            return parsed as T;
        } catch (error) {
            console.error(`[TaskPlanner] JSON parse error on attempt ${attempt + 1}:`, error);

            // On last attempt, try to fix common JSON issues
            if (attempt === Config.MAX_JSON_PARSE_RETRIES - 1) {
                try {
                    // Try fixing common issues like trailing commas
                    const fixedJson = jsonStr
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']');
                    const parsed = JSON.parse(fixedJson);
                    if (!validator || validator(parsed)) {
                        return parsed as T;
                    }
                } catch {
                    // Give up
                }
            }
        }
    }

    return null;
}
