// Flat ESLint config — fully type-aware, maximum strictness.
//
//  • typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` (uses the
//    TypeScript type checker, so rules like no-unsafe-* and no-floating-promises
//    apply across the codebase).
//  • `no-explicit-any` is a hard error — `any` is never allowed.
//  • Prettier owns formatting; eslint-config-prettier turns off conflicting rules.

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
    ],
  },

  // ── Type-checked rules for all source/test TypeScript ──────
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `any` is forbidden everywhere — no escape hatch.
      '@typescript-eslint/no-explicit-any': 'error',
      // The only tolerated unused identifier is a `_`-prefixed *argument* that a
      // signature contract forces us to keep (e.g. `validate(attribute, value, fail)`
      // implementations that don't read `attribute`). Unused locals and unused
      // caught errors remain hard errors — no escape hatch there.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Require explicit return types on exported/public functions.
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // Prefer `import type` for type-only imports (matches verbatimModuleSyntax).
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      // Numbers are fine to interpolate into messages.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Allow short-circuit / ternary side effects (e.g. `cond && fn()`).
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
  },

  // ── Config files & scripts: no project, no type-aware rules ─
  {
    files: [
      '**/*.config.{ts,mts,cts,js,mjs,cjs}',
      'eslint.config.js',
      'docs/.vitepress/**/*.{ts,mts}',
    ],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // ── Demo app: a generic DOM query helper is idiomatic here ──
  {
    files: ['demo/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
    },
  },

  // Prettier last — disables all stylistic rules that would conflict.
  prettier,
)
