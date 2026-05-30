import { defineConfig } from 'tsup'

// Build config for the publishable package (`npm run build`).
//
//  • Bundles src/lib/index.ts into dist/ as ESM (index.js) + CJS (index.cjs).
//  • `dts: true` emits a single bundled declaration per format — index.d.ts for
//    the ESM/`import` entry and index.d.cts for the CJS/`require` entry — which
//    is what `attw` checks for under node16/nodenext resolution.
//
// The `@/*` alias is resolved at build time from the `paths` mapping in
// tsconfig.build.json: esbuild reads it for the JS bundle and rollup-plugin-dts
// reads it for the declarations. Because tsup bundles everything into one file
// per format, no `@/*` import paths survive into dist.
//
// The demo app and docs have their own Vite/VitePress builds; tests use Vitest.
export default defineConfig({
  entry: { index: 'src/lib/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  target: 'es2022',
  clean: true,
  treeshake: true,
  sourcemap: false,
  minify: false,
  splitting: false,
  tsconfig: './tsconfig.build.json',
})
