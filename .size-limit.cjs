// Bundle-size budgets, enforced by size-limit in CI (`pnpm size`).
// Measured baseline (2026-07): ~14.7 KB min+brotli per entry point.
module.exports = [
  {
    name: 'import { Validator } (min+brotli)',
    path: 'packages/validator/dist/index.js',
    import: '{ Validator }',
    limit: '16 KB',
  },
  {
    name: 'import { validation } fluent builder (min+brotli)',
    path: 'packages/validator/dist/index.js',
    import: '{ validation }',
    limit: '16 KB',
  },
  {
    name: 'CDN IIFE bundle (min+brotli)',
    path: 'packages/validator/dist/index.global.js',
    limit: '17 KB',
  },
]
