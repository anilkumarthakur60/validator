import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Standalone Vue demo — consumes the published `@anil-labs/validator` package
// (linked via the pnpm workspace). Run with `pnpm example:vue` from the root.
export default defineConfig({
  plugins: [vue()],
  // Bind all interfaces so both http://localhost and http://127.0.0.1 work
  // (Vite's default `localhost` can resolve to IPv6 `::1` only).
  server: { host: true, port: 5173 },
})
