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

    return `Generate an EXECUTABLE task plan that an AI agent can run autonomously for an extended period without human intervention.

## User Request
${userRequest}

## Workspace Context
${context}

## Clarifying Q&A
${answersText}

## Critical: This Plan Must Be Agent-Executable

The output plan will be passed directly to an AI coding agent (like Claude or Copilot) that will execute it autonomously. The plan must contain ALL information needed for successful execution without asking further questions.

### Requirements for Autonomous Execution:
1. **Concrete file paths** - Use actual paths from the workspace context, not placeholders
2. **Specific commands** - Include exact CLI commands to run (build, test, lint, etc.)
3. **Clear success criteria** - How to verify each step is complete
4. **Error handling guidance** - What to do if something fails
5. **Dependencies between steps** - Which steps must complete before others

## Language Rule
IMPORTANT: Always generate the plan in ENGLISH, regardless of the user's language.

## Output Format

${mdBlock}
# Task: [Concise, specific task name]

## Context for Agent
[Brief context the executing agent needs to understand before starting.
Include: project type, key technologies, relevant patterns from the codebase.]

## Success Criteria
[Specific, verifiable conditions that indicate the task is COMPLETE.
The agent should check these at the end to confirm success.]
- [ ] [Criterion 1: e.g., "All tests pass: ${bq}npm test${bq} exits with code 0"]
- [ ] [Criterion 2: e.g., "No TypeScript errors: ${bq}npm run build${bq} succeeds"]
- [ ] [Criterion 3: specific to the task]

## Steps

### Step 1: [Action verb + specific target]
**Goal**: [What this step accomplishes]
**Files**:
- ${bq}path/to/file1.ts${bq} - [what to do with this file]
- ${bq}path/to/file2.ts${bq} - [what to do with this file]

**Actions**:
1. [Specific action with code example if helpful]
2. [Next action]

**Verify**: [How to confirm this step succeeded, e.g., "Run ${bq}npm test path/to/file.test.ts${bq}"]

---

### Step 2: [Action verb + specific target]
**Depends on**: Step 1
**Goal**: [What this step accomplishes]
**Files**:
- ${bq}path/to/file.ts${bq} - [what to do]

**Actions**:
1. [Specific action]

**Verify**: [Verification command or check]

---

[Continue with remaining steps...]

## Final Verification

### 1. Code Quality Checks
${bq}${bq}${bq}bash
# Build - must complete without errors
npm run build

# Tests - all must pass
npm test

# Lint - no errors (warnings OK)
npm run lint
${bq}${bq}${bq}

### 2. Functional Verification
[Task-specific verification that the feature/fix actually works]
- [Manual or automated check 1: e.g., "Run the app and verify login flow works"]
- [Manual or automated check 2: e.g., "Call the API endpoint and verify response"]
- [Include specific test commands, curl examples, or steps to verify]

### 3. Requirements Checklist
Verify each original requirement from the user request:
- [ ] [Requirement 1 from user request]: [How to verify it's met]
- [ ] [Requirement 2 from user request]: [How to verify it's met]

## Error Recovery
If you encounter issues:
- **Build fails**: [Specific guidance]
- **Tests fail**: [Specific guidance]
- **File not found**: [Specific guidance]
${mdBlock}

## Guidelines for Generating Executable Plans

### File Paths
- Extract REAL file paths from the Workspace Context
- Use relative paths from project root (e.g., ${bq}src/components/Button.tsx${bq})
- If creating new files, specify the exact path and initial content structure

### Commands
- Use the project's actual scripts from package.json
- Include full command with arguments (e.g., ${bq}npm test -- --coverage --watchAll=false${bq})
- Specify working directory if not project root

### Step Design
- Each step should be completable in 5-15 minutes
- Include 3-10 steps depending on complexity
- Order steps by dependency, then priority
- Make steps atomic - one clear objective per step

### Verification
- Every step MUST have a verification method
- Prefer automated checks (commands) over manual inspection
- Include expected output or success indicators

### Context Usage
- Reference existing code patterns from the workspace
- Use consistent naming conventions with the codebase
- Leverage existing utilities and helpers mentioned in context`;
}
