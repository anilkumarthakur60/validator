import { defineConfig } from 'tsup'

// Builds the publishable library from src/lib into dist/ as ESM + CJS with
// bundled type declarations. The `@/*` tsconfig alias is resolved at build time.
export default defineConfig({
  entry: { index: 'src/lib/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: false,
  minify: false,
  target: 'es2022',
  outDir: 'dist',
})
