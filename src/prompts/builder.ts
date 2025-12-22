/**
 * Fluent builder for constructing AI prompts with consistent structure
 */
export class PromptBuilder {
    private sections: string[] = [];
    private outputFormat: string | null = null;

    /**
     * Creates a new PromptBuilder with an optional role/context
     */
    static create(roleDescription?: string): PromptBuilder {
        const builder = new PromptBuilder();
        if (roleDescription) {
            builder.sections.push(roleDescription);
        }
        return builder;
    }

    /**
     * Adds a titled section to the prompt
     */
    section(title: string, content: string): this {
        this.sections.push(`## ${title}\n${content}`);
        return this;
    }

    /**
     * Adds a bullet list section
     */
    bulletSection(title: string, items: string[]): this {
        const bullets = items.map(item => `- ${item}`).join('\n');
        return this.section(title, bullets);
    }

    /**
     * Adds a numbered list section
     */
    numberedSection(title: string, items: string[]): this {
        const numbered = items.map((item, i) => `${i + 1}. ${item}`).join('\n');
        return this.section(title, numbered);
    }

    /**
     * Adds raw text content
     */
    text(content: string): this {
        this.sections.push(content);
        return this;
    }

    /**
     * Adds a code block
     */
    codeBlock(code: string, language?: string): this {
        const lang = language ?? '';
        this.sections.push(`\`\`\`${lang}\n${code}\n\`\`\``);
        return this;
    }

    /**
     * Adds important instructions with emphasis
     */
    important(instruction: string): this {
        this.sections.push(`**IMPORTANT**: ${instruction}`);
        return this;
    }

    /**
     * Sets the expected output format
     */
    output(format: string): this {
        this.outputFormat = format;
        return this;
    }

    /**
     * Adds JSON output format specification
     */
    jsonOutput(examples: Record<string, unknown>[]): this {
        const exampleStr = examples.map(e => JSON.stringify(e)).join('\n');
        this.outputFormat = `Return ONLY valid JSON.\n${exampleStr}`;
        return this;
    }

    /**
     * Builds the final prompt string
     */
    build(): string {
        const parts = [...this.sections];
        if (this.outputFormat) {
            parts.push(`## Output\n${this.outputFormat}`);
        }
        return parts.join('\n\n');
    }
}

/**
 * Common prompt utilities
 */
export const PromptUtils = {
    /**
     * Creates a language rule instruction
     */
    languageRule(matchInput: boolean): string {
        return matchInput
            ? 'IMPORTANT: Respond in the SAME LANGUAGE as the user\'s request.'
            : 'IMPORTANT: Always respond in ENGLISH, regardless of the user\'s language.';
    },

    /**
     * Wraps content in a markdown section
     */
    markdownSection(title: string, content: string): string {
        return `## ${title}\n${content}`;
    }
};
