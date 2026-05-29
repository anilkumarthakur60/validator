import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Standalone demo app. Run with `npm run demo` from the repo root.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Bind all interfaces so both http://localhost and http://127.0.0.1 work
  // (Vite's default `localhost` can resolve to IPv6 `::1` only).
  server: { host: true, port: 5173 },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('../dist/demo', import.meta.url)),
    emptyOutDir: true,
  },
})
