import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// Build config for the publishable package (`npm run build`).
//
//  • `vite build` bundles src/lib/index.ts into dist/ as ESM + CJS.
//  • vite-plugin-dts emits a single bundled declaration file (rollupTypes),
//    resolving the `@/*` tsconfig alias along the way.
//  • Vite only ever produces an ESM-flavoured `.d.ts`; we copy it to `.d.cts`
//    so the `require` entry in package.json#exports has matching CJS types
//    (this is what `attw` checks for).
//
// The demo app has its own config at demo/vite.config.ts; the test runner uses
// vitest.config.ts. `vite` (dev) still serves the root sanity app from
// index.html — build options here are ignored in dev mode.
const resolve = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('./src'),
    },
  },
  plugins: [
    dts({
      include: ['src/lib'],
      // Bundle the whole declaration tree into a single dist/index.d.ts
      // (via @microsoft/api-extractor), resolving the `@/*` alias on the way.
      bundleTypes: true,
      tsconfigPath: './tsconfig.json',
      // Vite only emits an ESM-flavoured `.d.ts`; mirror it to `.d.cts` for the
      // CJS `require` entry. We write from the emitted content map so it works
      // regardless of when the file is flushed to disk.
      afterBuild: (emitted) => {
        for (const [file, content] of emitted) {
          if (file.endsWith('.d.ts')) {
            writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), content)
          }
        }
      },
    }),
  ],
  build: {
    target: 'es2022',
    minify: false,
    sourcemap: false,
    // This is a code-only library — don't copy demo/public assets into dist.
    copyPublicDir: false,
    lib: {
      entry: resolve('./src/lib/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // Zero runtime dependencies — nothing to externalise.
      external: [],
    },
  },
})
