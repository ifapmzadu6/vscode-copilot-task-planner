import { CollectedAnswer } from '../../types/messages';
import { formatAnswersText } from './shared';

/**
 * Prompt template for plan generation
 */

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
