import { defineConfig } from 'vitepress'

// VitePress site for @hc/validation. Run `npm run docs:dev`.
export default defineConfig({
  title: '@hc/validation',
  description: 'A Laravel-compatible, strictly-typed validation library for TypeScript.',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Rules', link: '/rules' },
      { text: 'API', link: '/api' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is @hc/validation?', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick start', link: '/guide/quickstart' },
          ],
        },
        {
          text: 'Core concepts',
          items: [
            { text: 'Dataset validation', link: '/guide/dataset-validation' },
            { text: 'Error messages', link: '/guide/error-messages' },
            { text: 'Working with validated input', link: '/guide/validated-input' },
            { text: 'Conditional rules', link: '/guide/conditional-rules' },
            { text: 'Arrays & nested data', link: '/guide/arrays-and-nesting' },
          ],
        },
        {
          text: 'Recipes',
          items: [
            { text: 'Validating files', link: '/guide/files' },
            { text: 'Validating passwords', link: '/guide/passwords' },
            { text: 'Custom rules', link: '/guide/custom-rules' },
            { text: 'Async & database rules', link: '/guide/async-rules' },
            { text: 'Fluent builder (Quasar/Vue)', link: '/guide/fluent-builder' },
            { text: 'Backend usage (Node)', link: '/guide/backend' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Available rules', link: '/rules' },
            { text: 'API', link: '/api' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/your-org/validation' }],
    search: { provider: 'local' },
    outline: 'deep',
  },
})
