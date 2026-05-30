---
layout: home

hero:
  name: '@hc/validation'
  text: Laravel-compatible validation for TypeScript
  tagline: One strictly-typed engine, two APIs — full dataset validation and a chainable Quasar/Vue rule builder. 100% test coverage, zero `any`.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Available rules
      link: /rules
    - theme: alt
      text: API reference
      link: /api

features:
  - title: Laravel parity
    details: Same rule names, same messages, dot & * wildcard nesting, MessageBag, validated()/safe(), conditional and cross-field rules.
  - title: Framework-agnostic
    details: A pure-TypeScript core that runs in the browser, Node (Express/NestJS/Fastify), workers, and edge runtimes.
  - title: Two APIs, one engine
    details: Validator.make(data, rules) for whole datasets, plus a chainable validation.required().email() builder for Quasar/Vue :rules.
  - title: Strict & tested
    details: Compiled under the strictest TypeScript settings with no `any`, linted type-aware, and covered by a 100% Vitest suite.
  - title: Async-ready
    details: Pluggable resolvers for exists, unique, current_password, and Password.uncompromised() — perfect for backends.
  - title: Extensible
    details: Add rules via closures, rule objects, a global registry, or the fluent builder's extend().
---

## At a glance

```ts
import { Validator } from '@hc/validation'

const validator = Validator.make(
  { email: 'not-an-email', users: [{ name: 'Ada' }, { name: '' }] },
  {
    email: 'required|email',
    'users.*.name': 'required|string|max:255',
  },
)

validator.fails() // true
validator.errors().first('email') // "The email field must be a valid email address."
validator.errors().messages() // { email: [...], "users.1.name": [...] }
```
