// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    prettierConfig,
    {
        plugins: {
            prettier,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Prettier formatting
            'prettier/prettier': 'error',
            // VSCode API types include 'never' in unions - external dependency issue
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            // Allow unused vars with underscore prefix
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            // Control characters are intentionally used in JSON fix regex
            'no-control-regex': 'off',
            // Allow numbers and booleans in template literals (common logging pattern)
            '@typescript-eslint/restrict-template-expressions': ['error', {
                allowNumber: true,
                allowBoolean: true,
            }],
        },
    },
    {
        ignores: ['out/**', 'node_modules/**', '*.js'],
    }
);
