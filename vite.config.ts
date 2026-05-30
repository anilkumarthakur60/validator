import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Vite is used only for the root sanity app (`npm run dev`, served from
// index.html → src/main.ts). The publishable library is built with tsup
// (`npm run build`, see tsup.config.ts); the demo and docs have their own builds.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
