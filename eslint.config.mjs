// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // VSCode API types include 'never' in unions - nothing we can do about it
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            // Allow unused vars with underscore prefix
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            // Interface implementations may require async without await
            '@typescript-eslint/require-await': 'off',
            // Control characters are intentionally used in JSON fix regex
            'no-control-regex': 'off',
        },
    },
    {
        ignores: ['out/**', 'node_modules/**', '*.js'],
    }
);
