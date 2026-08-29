# @anil-labs/validator

[![npm](https://img.shields.io/npm/v/%40anil-labs%2Fvalidator.svg)](https://www.npmjs.com/package/@anil-labs/validator)
[![CI](https://github.com/anilkumarthakur60/validator/actions/workflows/ci.yml/badge.svg)](https://github.com/anilkumarthakur60/validator/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/badge/bundle-~15%20KB%20min%2Bbrotli-blue)](https://github.com/anilkumarthakur60/validator/blob/main/.size-limit.cjs)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

An **expressive**, strictly-typed validation library for TypeScript.

- 🧩 **Framework-agnostic core**  works in Node (Express, NestJS, Fastify), the browser, workers, and edge runtimes.
- 🎯 **Comprehensive rule set**  100+ built-in rules with human-friendly messages, dot/`*` wildcard nesting, `MessageBag`, `validated()`/`safe()`, conditional & cross-field rules.
- 🪝 **Two APIs, one engine**  a full dataset `Validator.make(data, rules)` **and** a chainable single-field builder for Quasar/Vue `:rules`.
- 🔒 **100% TypeScript, zero `any`**  compiled under the strictest settings, **100% test coverage**.
- 🧠 **Type inference**  pass a rules literal and `validated()` returns a precisely-typed object (`InferRules`), no `as const` needed.
- ⚡ **Async-ready**  pluggable resolvers for `exists`, `unique`, `current_password`, and `Password.uncompromised()`.

> 📖 **Full documentation:** run `pnpm docs:dev` (VitePress) or see the [`docs/`](https://github.com/anilkumarthakur60/validator/tree/main/docs) directory.

---

## Install

```bash
npm install @anil-labs/validator
```

Ships ESM + CJS with bundled type declarations. Requires Node ≥ 20.

### CDN  no build step

The package also ships a minified IIFE with every export on a `Validator` global:

```html
<script src="https://unpkg.com/@anil-labs/validator"></script>
<script>
  const { Validator, validation } = window.Validator
  Validator.make({ email: 'oops' }, { email: 'required|email' }).fails() // true
</script>
```

(Also available from jsDelivr: `https://cdn.jsdelivr.net/npm/@anil-labs/validator`.)

---

## Quick start

### Dataset validation

```ts
import { Validator } from '@anil-labs/validator'

const validator = Validator.make(
  {
    title: 'Hello world',
    author: { name: 'Ada' },
    users: [{ email: 'a@b.com' }, { email: 'oops' }],
  },
  {
    title: 'required|string|max:255',
    'author.name': ['required'],
    'users.*.email': 'required|email',
  },
)

if (validator.fails()) {
  validator.errors().first('users.1.email')
  // "The users.1.email field must be a valid email address."
  validator.errors().messages() // { "users.1.email": [...] }
} else {
  const data = validator.validated()
}
```

### Type inference

Pass the rules as a literal and `validated()` is fully typed  no `as const`, no
separate interface:

```ts
const data = Validator.make(
  { title: 'Hi', count: 5, author: { name: 'Ada' }, users: [{ email: 'a@b.com' }] },
  {
    title: 'required|string',
    count: 'required|integer',
    'author.name': 'required|string',
    'users.*.email': 'required|email',
    note: 'nullable|string',
  },
).validate()

// data: {
//   title: string; count: number; author: { name: string };
//   users: { email: string }[]; note?: string | null
// }
data.users[0]?.email // ✅ typed
```

Use `InferRules<typeof rules>` to derive the type without running validation. The
engine validates but doesn't coerce, so inferred types reflect each rule's
intended type  see the [Type inference guide](./docs/guide/type-inference.md).

### Fluent builder (Quasar / Vue `:rules`)

```vue
<script setup lang="ts">
import { validation } from '@anil-labs/validator'
</script>

<template>
  <q-input v-model="email" :rules="[validation.required().email().toRule()]" />
  <!-- .toRule() is optional  a chain is directly callable -->
  <q-input v-model="age" :rules="[validation.required().integer().between(1, 120)]" />
</template>
```

### Rule objects

```ts
import { Validator, Rule, Password, FileRule } from '@anil-labs/validator'

Validator.make(data, {
  role: [Rule.in(['admin', 'editor'])],
  status: [Rule.enum(ServerStatus)],
  username: ['required', Rule.anyOf([['email'], ['alpha_dash', 'min:6']])],
  email: [Rule.email().rfcCompliant().preventSpoofing()],
  title: [Rule.string().min(3).max(255)],
  starts_at: [Rule.date().afterToday()],
  password: ['required', 'confirmed', Password.min(8).mixedCase().numbers().symbols()],
  avatar: [FileRule.image().max('2mb').dimensions(Rule.dimensions().maxWidth(1000))],
})
```

### Async rules (backend / network)

```ts
const v = Validator.make(body, { email: 'required|email|unique:users' }).withResolvers({
  unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
})

if (await v.failsAsync()) {
  // 422 { errors: v.errors().messages() }
}
```

---

## Using it on a Node backend

The engine is pure TypeScript with no DOM coupling. Example Express handler:

```ts
import { Validator } from '@anil-labs/validator'

app.post('/users', async (req, res) => {
  const v = Validator.make(req.body, {
    name: 'required|string|max:255',
    email: 'required|email|unique:users',
    password: 'required|min:8|confirmed',
  }).withResolvers({
    unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
  })

  if (await v.failsAsync()) return res.status(422).json({ errors: v.errors().messages() })
  return res.status(201).json(await db.create(v.validated()))
})
```

> Server notes: `dimensions` needs a browser image decoder, so it passes on Node (use `sharp` in a custom rule for real checks). File rules need the global `File` (Node ≥ 20).

---

## Custom rules

```ts
// 1. Inline closure
validation.required().custom((v) => String(v).startsWith('HC-') || 'Must start with HC-')

// 2. Rule object
import type { ValidationRuleObject } from '@anil-labs/validator'
class Uppercase implements ValidationRuleObject {
  validate(attribute: string, value: unknown, fail: (m: string) => void) {
    if (String(value) !== String(value).toUpperCase()) fail('The :attribute must be uppercase.')
  }
}

// 3. Global named rule
import { registerRule, defaultMessages } from '@anil-labs/validator'
registerRule('slug', { validate: (ctx) => /^[a-z0-9-]+$/.test(String(ctx.value)) })
defaultMessages.slug = 'The :attribute must be a valid slug.'

// 4. Quasar builder rule
validation.extend('nepaliPhone', (v) => /^(\+977)?9[78]\d{8}$/.test(String(v)) || 'Invalid phone.')
validation.required().rule('nepaliPhone')
```

---

## Developing (from the monorepo root)

| Script | Purpose |
| --- | --- |
| `pnpm build` | Build the publishable library (`dist/`, incl. the CDN IIFE) |
| `pnpm test` / `pnpm test:coverage` | Run the Vitest suite (100% coverage gate) |
| `pnpm lint` / `pnpm typecheck` | Strict, type-aware lint + typecheck |
| `pnpm docs:dev` | VitePress documentation site |
| `pnpm example:vanilla` / `pnpm example:vue` | Interactive demo apps |
| `pnpm --filter @anil-labs/validator run check:exports` | `publint` + `attw` package validation |

## License

[MIT](./LICENSE)
