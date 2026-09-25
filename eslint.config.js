// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      '.wrangler/',
      'node_modules/',
      'worker-configuration.d.ts',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'import-x': importX },
    rules: {
      // Same ordering rule as ColdBoot, via import-x (eslint-plugin-import
      // does not support ESLint 10).
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'sort-imports': 'off',
      // Warn on explicit `any` to keep TypeScript strict mode meaningful.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Intentional no-ops must include a comment explaining why.
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
  // Formatting is Prettier's job; turn off any stylistic rules that clash.
  prettier,
);
