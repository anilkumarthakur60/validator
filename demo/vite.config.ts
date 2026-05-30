import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Standalone Vue demo app. Run with `npm run demo` from the repo root.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  // Bind all interfaces so both http://localhost and http://127.0.0.1 work
  // (Vite's default `localhost` can resolve to IPv6 `::1` only).
  server: { host: true, port: 5173 },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  build: {
    // Build into demo/dist (gitignored, NOT the publishable root dist/).
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
})
