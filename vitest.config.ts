import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test runner config — kept separate from the library build (vite.config.ts)
// so the build-only plugins (vite-plugin-dts, lib mode) never load under Vitest.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/lib/**/*.ts'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
