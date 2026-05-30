import { defineConfig } from 'vitepress'

// VitePress site for @anil-labs/validator. Run `npm run docs:dev`.
export default defineConfig({
  title: '@anil-labs/validator',
  description: 'An expressive, strictly-typed validation library for TypeScript.',
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
            { text: 'What is @anil-labs/validator?', link: '/guide/introduction' },
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
            { text: 'Fluent builder', link: '/guide/fluent-builder' },
          ],
        },
        {
          text: 'Frontend frameworks',
          items: [
            { text: 'Vue', link: '/guide/vue' },
            { text: 'React', link: '/guide/react' },
            { text: 'Svelte', link: '/guide/svelte' },
            { text: 'SolidJS', link: '/guide/solid' },
            { text: 'Angular', link: '/guide/angular' },
          ],
        },
        {
          text: 'Backend frameworks',
          items: [
            { text: 'Overview (Node)', link: '/guide/backend' },
            { text: 'Express', link: '/guide/express' },
            { text: 'Fastify', link: '/guide/fastify' },
            { text: 'NestJS', link: '/guide/nestjs' },
            { text: 'Hono (edge)', link: '/guide/hono' },
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
