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

    return `Generate a comprehensive, actionable task plan that accurately reflects the user's true intent.

## User Request
${userRequest}

## Workspace Context
${context}

## Clarifying Q&A
${answersText}

## Your Task: Intent-Driven Plan Generation

### Step 1: Extract User Intent
Before writing the plan, analyze the Q&A to understand:
1. **Core Motivation**: WHY does the user want this? What problem are they solving?
2. **Success Vision**: What does the user consider a successful outcome?
3. **Priorities**: What aspects are MOST important to the user?
4. **Implicit Expectations**: What did the user assume but not explicitly state?
5. **Constraints**: What limitations or preferences did they express?

### Step 2: Generate Intent-Aligned Plan
Create a plan that:
- Addresses the user's UNDERLYING needs, not just surface requirements
- Prioritizes what the user cares about most
- Avoids unnecessary complexity that doesn't serve user goals
- Matches the user's expected level of effort and scope

## Language Rule
IMPORTANT: Always generate the plan in ENGLISH, regardless of the user's language.

## Output Format
${mdBlock}
# Task: [Concise task name]

## User Intent Summary
[2-3 sentences: Synthesize what the user truly wants to achieve based on the Q&A.
Include their core motivation, what success looks like to them, and any key priorities.]

## Overview
[1-2 sentences: What will be implemented and how it serves the user's intent]

## Goals
- [Goal that directly addresses user's primary motivation]
- [Goal aligned with user's success criteria]

## Scope
### In Scope (prioritized by user importance)
- [Most important to user - based on Q&A]
- [Secondary priorities]

### Out of Scope
- [What is explicitly excluded and why]

## Approach
- [Technical approach chosen to best serve user intent]
- [Why this approach matches user's constraints/preferences]

## Completion Criteria
- [How to verify the user's intent has been fulfilled]
- [Specific checks aligned with user's success vision]

## Steps
1. [Step that addresses user's highest priority first]
2. [Next step...]
${mdBlock}

## Guidelines
- PRIORITIZE steps based on user's expressed priorities
- Make each step atomic and independently verifiable
- Include specific file paths when known
- Steps should be 5-15 minutes of work each
- Aim for 3-8 steps total
- Ensure every step serves the user's stated intent`;
}
