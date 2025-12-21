/**
 * Prompt template for workspace analysis
 */

/**
 * Builds prompt for analyzing workspace context
 */
export function buildAnalyzeWorkspacePrompt(userRequest: string): string {
    return `Analyze the current workspace to provide context for implementing: "${userRequest}"

## Analysis Focus
1. **Project Structure**: Identify key directories, entry points, and architectural patterns
2. **Tech Stack**: Detect frameworks, languages, build tools, and dependencies
3. **Relevant Files**: Find files likely to be modified or referenced for this task
4. **Existing Patterns**: Note coding conventions, naming patterns, and design patterns used

## Output Requirements
- Provide a concise summary (max 150 words)
- Focus ONLY on information relevant to the user's request
- Use bullet points for clarity
- Respond in the SAME LANGUAGE as the user's request`;
}
