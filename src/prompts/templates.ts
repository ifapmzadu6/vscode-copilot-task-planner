import { CollectedAnswer } from '../types/messages';

/**
 * Prompt template builders for subagent invocations
 */

/**
 * Formats collected answers into a readable text format
 */
export function formatAnswersText(answers: CollectedAnswer[]): string {
    if (answers.length === 0) {
        return 'No questions asked yet.';
    }
    return answers
        .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
        .join('\n\n');
}

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

/**
 * Builds prompt for generating the next question
 */
export function buildNextQuestionPrompt(
    userRequest: string,
    context: string,
    answers: CollectedAnswer[]
): string {
    const answersText = formatAnswersText(answers);

    return `You are a task planning assistant. Generate the NEXT clarifying question.

## User Request
${userRequest}

## Context
${context}

## Previous Q&A
${answersText}

## Your Task
Before generating a question, you MAY investigate the workspace or use other tools if needed to understand the project better.
Then decide if you need more information. Ask about:
- Goals and success criteria
- Scope and boundaries
- Technical constraints
- Dependencies or risks

## Language Rule
IMPORTANT: Respond in the SAME LANGUAGE as the user's request. If the user wrote in Japanese, generate the question and options in Japanese. If in English, use English.

## Question Format Rules
- ALWAYS use "select" type with exactly 4 options
- Make options specific and relevant to THIS project based on your investigation
- The 5th "Other" option will be automatically added by the UI

## Output (JSON only)
If enough info: {"done": true, "reason": "brief reason"}
If need more: {"done": false, "question": {"text": "Question?", "type": "select", "options": ["Option 1", "Option 2", "Option 3", "Option 4"] }}

Return ONLY valid JSON.`;
}

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

/**
 * Builds prompt for generating the refined task prompt
 */
export function buildRefinedPromptPrompt(
    userRequest: string,
    context: string,
    answers: CollectedAnswer[]
): string {
    const answersText = formatAnswersText(answers);
    const bq = '`';
    const mdBlock = bq + bq + bq;

    return `Generate a comprehensive, actionable task plan based on the gathered information.

## User Request
${userRequest}

## Workspace Context
${context}

## Clarifying Q&A
${answersText}

## Language Rule
IMPORTANT: Always generate the plan in ENGLISH, regardless of the user's language.

## Output Format
${mdBlock}
# Task: [Concise task name]

## Overview
[1-2 sentences: What will be implemented and why it's needed]

## Goals
- [Specific, measurable goal 1]
- [Specific, measurable goal 2]

## Scope
- [Specific files/directories to modify]
- [What is OUT of scope]

## Approach
- [Key technical decisions and why]
- [Libraries/APIs to use]

## Completion Criteria
- [How to verify the task is complete]
- [Tests or checks to run]

## Steps
1. [Atomic, actionable step - should take ~5-15 min each]
2. [Next step...]
${mdBlock}

## Guidelines
- Make each step atomic and independently verifiable
- Include specific file paths when known
- Steps should be 5-15 minutes of work each
- Aim for 3-8 steps total`;
}

/**
 * Builds prompt for registering tasks to todo list
 */
export function buildRegisterTasksPrompt(refinedPrompt: string): string {
    return `You are a task registration assistant.

Extract the implementation steps from the following task plan and register each step as a todo item using the manage_todo_list tool.

## Task Plan
${refinedPrompt}

## Instructions
1. Extract all numbered steps from the "## Steps" section
2. Use the manage_todo_list tool to add each step as a todo item
3. After registering, confirm completion

Do NOT output the full plan in chat. Just register the todos and confirm.`;
}
