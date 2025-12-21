/**
 * Prompt templates for plan operations (translate, revise)
 */

/**
 * Builds prompt for translating the plan
 */
export function buildTranslatePlanPrompt(plan: string, targetLang: string): string {
    return `Translate the following task plan to ${targetLang}.

## Translation Rules
1. **Preserve Structure**: Keep all Markdown formatting (headers, lists, code blocks) intact
2. **Technical Terms**: Keep technical terms, code snippets, file paths, and command names in their original form
3. **Consistency**: Maintain consistent terminology throughout the translation
4. **Natural Flow**: Use natural expressions in ${targetLang}, not literal translations

## Task Plan
${plan}

Return ONLY the translated plan with no additional explanations.`;
}

/**
 * Builds prompt for revising the plan based on feedback
 */
export function buildRevisePlanPrompt(currentPlan: string, feedback: string): string {
    return `Revise the following task plan based on user feedback.

## Current Plan
${currentPlan}

## User Feedback
${feedback}

## Instructions
- Apply the user's feedback to modify the plan
- Keep the same structure and format
- Respond in the same language as the current plan
- Return ONLY the revised plan, no explanations`;
}
