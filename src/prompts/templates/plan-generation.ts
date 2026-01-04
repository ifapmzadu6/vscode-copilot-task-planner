import { CollectedAnswer } from '../../types/messages';
import { formatAnswersText } from './shared';

/**
 * Prompt template for plan generation
 */

/**
 * Builds prompt for generating the refined task prompt.
 * NOTE: This prompt does NOT include READONLY_CONSTRAINT because the subagent
 * needs to write the plan to a file (via invokeSubagentWithFileOutput).
 */
export function buildPlanGenerationPrompt(userRequest: string, context: string, answers: CollectedAnswer[]): string {
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

### Requirements for High-Quality Agent Reasoning:
The executing agent needs guidance on HOW TO THINK, not just what to do:
1. **Rationale** - WHY this approach is chosen over alternatives
2. **Design Intent** - The underlying design principles and patterns to follow
3. **Decision Criteria** - How to make judgment calls when facing ambiguity
4. **Anti-patterns** - What to AVOID and why (common mistakes)
5. **Edge Cases** - Specific scenarios to watch out for during implementation

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

## Design Principles
[Key architectural decisions and reasoning that guide this implementation.
The agent should internalize these principles before starting.]

### Approach Rationale
[WHY this approach was chosen. What alternatives were considered and why they were rejected.]

### Codebase Patterns to Follow
[Existing patterns in this codebase that should be replicated for consistency.]
- [Pattern 1: e.g., "Error handling uses Result<T, E> pattern - see ${bq}src/utils/result.ts${bq}"]
- [Pattern 2: e.g., "All services are singleton classes with ${bq}getInstance()${bq} method"]

### Anti-patterns to Avoid
[Common mistakes that would cause problems. The agent should actively avoid these.]
- ❌ [Anti-pattern 1: e.g., "Don't use synchronous file operations - use async/await"]
- ❌ [Anti-pattern 2: e.g., "Don't hardcode configuration values - use constants from config"]

## Steps

### Step 1: [Action verb + specific target]
**Goal**: [What this step accomplishes]

**Thinking Guide**:
> Before starting, consider: [Key questions the agent should ask themselves]
> - [e.g., "What existing code can I reference for this pattern?"]
> - [e.g., "What could go wrong here and how should I handle it?"]
> Decision criteria: [How to handle ambiguous situations in this step]

**Files**:
- ${bq}path/to/file1.ts${bq} - [what to do with this file]
- ${bq}path/to/file2.ts${bq} - [what to do with this file]

**Actions**:
1. [Specific action with code example if helpful]
2. [Next action]

**Watch Out For**:
- ⚠️ [Potential pitfall and how to avoid it]

**Verify**: [How to confirm this step succeeded, e.g., "Run ${bq}npm test path/to/file.test.ts${bq}"]

**If Blocked**: [What to do if this step cannot be completed]
- Fallback approach: [Alternative way to achieve the goal]
- Skip condition: [When it's OK to skip and continue]

➡️ **Next**: Immediately proceed to Step 2 after verification passes.

---

### Step 2: [Action verb + specific target]
**Depends on**: Step 1 (but can proceed with partial completion if: [condition])
**Goal**: [What this step accomplishes]

**Thinking Guide**:
> [Reasoning guidance specific to this step]
> Decision criteria: [How to make judgment calls]

**Files**:
- ${bq}path/to/file.ts${bq} - [what to do]

**Actions**:
1. [Specific action]

**Watch Out For**:
- ⚠️ [Potential pitfall specific to this step]

**Verify**: [Verification command or check]

**If Blocked**: [Fallback approach or skip condition]

➡️ **Next**: Immediately proceed to Step 3.

---

### Step 3: Self-Review Checkpoint (MANDATORY)
⚠️ **THIS STEP IS REQUIRED** - Do not skip. Review the implementation from the previous 2-3 steps before continuing.

**Goal**: Verify implementation quality and catch issues before proceeding

**Thinking Guide**:
> STOP and review before continuing. This is not optional.
> - Is the code following the patterns identified in "Codebase Patterns to Follow"?
> - Are you avoiding the anti-patterns listed earlier?
> - Would this code be maintainable by another developer?
> - Have you introduced any bugs or regressions?

**Review Checklist** (ALL items must pass):
- [ ] Code follows existing patterns from [reference file]
- [ ] Error handling is comprehensive and consistent
- [ ] No placeholder values or TODOs left unaddressed
- [ ] TypeScript types are accurate (or equivalent for other languages)
- [ ] Changes are minimal and focused (no scope creep)
- [ ] No obvious bugs or logical errors
- [ ] Code compiles/builds without errors

**Actions**:
1. Re-read the code you just wrote with fresh eyes
2. Compare implementation against similar existing code
3. Run verification commands: ${bq}npm run build${bq}, ${bq}npm test${bq}
4. Check for common mistakes specific to this task

**If Issues Found**:
- Document the issue clearly
- Go back to the relevant step and fix immediately
- Re-run this review after fixing
- Do NOT proceed until all checklist items pass

➡️ **Next**: Only after ALL checklist items pass, proceed to Step 4.

---

[Continue with remaining implementation steps. MANDATORY: Insert a self-review step after every 2-3 implementation steps]

## Final Self-Review
⚠️ **MANDATORY** - Complete this review before Final Verification

**Goal**: Comprehensive review of ALL changes before declaring completion

**Thinking Guide**:
> Before running final verification, ensure all work meets quality standards.
> This is your last chance to catch issues before the task is considered complete.

**Comprehensive Checklist**:
- [ ] All Success Criteria from the beginning of this plan are addressed
- [ ] All implementation steps are complete (none skipped without documented reason)
- [ ] Code follows ALL patterns identified in "Codebase Patterns to Follow"
- [ ] None of the "Anti-patterns to Avoid" are present in the code
- [ ] All previous self-review issues have been resolved
- [ ] No debugging code, console.logs, or temporary code remains
- [ ] Code is properly formatted and follows project conventions
- [ ] All new code has appropriate error handling

**Actions**:
1. Review the diff of all changes made during this task
2. Verify each Success Criterion is met
3. Run full build and test suite
4. Check for any regressions in existing functionality

**If Issues Found**:
- Fix immediately before proceeding
- Document what was fixed and why
- Re-run this checklist after fixes

➡️ **Next**: Only after ALL items pass, proceed to Final Verification.

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

## Agent Decision Guidelines
When facing uncertainty during execution, use these principles:

### When Stuck on Implementation Details
1. First, look for similar patterns in the existing codebase
2. Prefer consistency with existing code over "better" approaches
3. If truly novel, follow the project's conventions (naming, structure, error handling)

### When Multiple Approaches Seem Valid
Prioritize in this order:
1. **Simplicity** - Choose the approach with fewer moving parts
2. **Consistency** - Match existing patterns in the codebase
3. **Testability** - Prefer approaches that are easier to test
4. **Maintainability** - Consider future developers reading this code

### When Encountering Unexpected Situations
- If a file doesn't exist where expected: check for similar files, the structure may have changed
- If a test fails unexpectedly: verify the test is testing the right thing before changing implementation
- If types don't match: understand the existing type system before introducing new types

## Autonomous Execution Guidelines
**CRITICAL: This section ensures the agent continues executing without stopping.**

### Maintain Forward Momentum
- After completing each step, IMMEDIATELY proceed to the next step
- Do NOT pause to ask for confirmation between steps
- Do NOT stop to summarize progress mid-execution
- Treat this plan as a continuous workflow, not a series of checkpoints

### Self-Recovery Protocol
When encountering obstacles, follow this priority:
1. **Try alternative approaches** (at least 2-3 variations) before considering the step blocked
2. **Search the codebase** for similar implementations to reference
3. **Simplify the approach** if the original seems too complex
4. **Document the issue and proceed** - leave a TODO comment and continue with remaining steps
5. Only stop execution if the blocker affects ALL remaining steps

### Progress Checkpoints
After every 2-3 steps, briefly verify:
- [ ] Previous steps' changes are still intact (no regressions)
- [ ] The project still builds/compiles
- [ ] You're still aligned with the Success Criteria
Then continue immediately - do not wait for feedback.

### Completion Signals
Keep executing until ALL of these are true:
- [ ] All steps in this plan are completed or explicitly skipped with documented reason
- [ ] All Success Criteria are verified
- [ ] Final Verification checks pass
- [ ] No TODO comments were left unaddressed (or they are documented as intentional deferrals)

### What NOT to Do (Anti-patterns for Autonomous Execution)
- ❌ Stopping to ask "Should I continue?"
- ❌ Waiting for user confirmation after each step
- ❌ Giving up after a single failed attempt
- ❌ Stopping at the first error without trying alternatives
- ❌ Summarizing progress instead of continuing execution
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
- **Insert Self-Review Steps**: After every 2-3 implementation steps, insert a dedicated review step
  - Review steps verify quality before proceeding
  - Include specific checklist items to review
  - Allow the agent to catch issues early and self-correct

### Verification
- Every step MUST have a verification method
- Prefer automated checks (commands) over manual inspection
- Include expected output or success indicators

### Context Usage
- Reference existing code patterns from the workspace
- Use consistent naming conventions with the codebase
- Leverage existing utilities and helpers mentioned in context

### Thinking Guidance Quality
- Each step's "Thinking Guide" should pose questions the agent should consider BEFORE coding
- Include "Decision criteria" to help the agent make judgment calls
- "Watch Out For" should list specific, actionable warnings (not generic advice)
- Anti-patterns should reference actual patterns in this codebase, not generic best practices

### Design Principles Section
- "Approach Rationale" must explain WHY this approach, not just WHAT
- List at least 2 alternatives that were considered and why they were rejected
- "Codebase Patterns" should cite specific files as examples
- "Anti-patterns" should be specific to this task and codebase

### Self-Review Steps Integration (MANDATORY)
**REQUIRED**: You MUST insert self-review steps throughout the plan. Plans without self-review steps are INVALID.

**When to Insert Self-Review Steps**:
- After implementing 2-3 related features → MUST insert review step
- After completing a major architectural change → MUST insert review step  
- Before moving to a new subsystem or module → MUST insert review step

**Self-Review Step Requirements**:
- Use the format: ${bq}### Step N: Self-Review Checkpoint (MANDATORY)${bq} (where N is the next step number)
- Reference the "Codebase Patterns to Follow" and "Anti-patterns to Avoid"
- Include 5-8 specific checklist items relevant to what was just implemented
- Provide concrete verification commands (build, test, lint)
- Include "Do NOT proceed until all checklist items pass"

**Why This is Mandatory**:
- Catches errors early before they compound
- Ensures consistent quality throughout implementation
- Maintains forward momentum by preventing major rework later
- Gives the agent explicit permission to pause and verify work`;
}
