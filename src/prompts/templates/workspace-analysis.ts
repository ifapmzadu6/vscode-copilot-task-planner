/**
 * Prompt template for workspace analysis
 */

/**
 * Builds prompt for analyzing workspace context
 */
export function buildAnalyzeWorkspacePrompt(userRequest: string): string {
    return `Analyze the current workspace to provide context for understanding user intent: "${userRequest}"

## Analysis Focus

### 1. Project Understanding
- **Project Purpose**: What does this project do? Who are its users?
- **Project Structure**: Key directories, entry points, and architectural patterns
- **Tech Stack**: Frameworks, languages, build tools, and dependencies

### 2. Request Context Analysis
- **Related Code**: Find existing code related to the user's request
- **Similar Features**: Are there similar implementations we can learn from?
- **Affected Areas**: What parts of the codebase might be impacted?

### 3. Intent Inference Hints
- **Common Patterns**: What approach does this codebase typically use for similar tasks?
- **Potential Concerns**: Based on the codebase, what considerations might be important?
- **Typical User Expectations**: What would users of this project likely expect?

## Output Requirements
- Provide a concise summary (max 200 words)
- Focus on information that helps understand the USER'S INTENT
- Highlight anything that might reveal implicit expectations or constraints
- Note any patterns that suggest what the user might expect but didn't state
- Use bullet points for clarity
- Respond in the SAME LANGUAGE as the user's request`;
}
