import { defineConfig } from 'tsup'

// Build config for the publishable package.
//
//  • Bundles src/index.ts into dist/ as ESM (index.js) + CJS (index.cjs), with
//    a bundled declaration per format (index.d.ts / index.d.cts) so `attw`
//    stays green under node16/nodenext resolution.
//  • Also emits a minified IIFE (index.global.js) exposing a `Validator` global
//    for `<script src="https://unpkg.com/@anil-labs/validator">` CDN usage.
//
// The `@/*` alias resolves at build time from tsconfig paths; because tsup
// bundles everything into one file per format, no `@/*` imports survive to dist.
export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    outDir: 'dist',
    target: 'es2022',
    clean: true,
    treeshake: true,
    sourcemap: false,
    minify: false,
    splitting: false,
  },
  {
    // CDN drop-in: <script src="https://unpkg.com/@anil-labs/validator"></script>
    entry: { index: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Validator',
    outDir: 'dist',
    target: 'es2022',
    clean: false,
    treeshake: true,
    minify: true,
    sourcemap: true,
  },
])
