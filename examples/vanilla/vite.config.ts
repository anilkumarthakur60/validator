import { defineConfig } from 'vite'

// Framework-free demo — consumes the published `@anil-labs/validator` package
// via the pnpm workspace. Run with `pnpm example:vanilla` from the root.
export default defineConfig({
  server: { host: true, port: 5174 },
})
