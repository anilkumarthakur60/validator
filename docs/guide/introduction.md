# What is @anil-labs/validator?

`@anil-labs/validator` is a strictly-typed, framework-agnostic validation library for
TypeScript. It provides an expressive, string-based rule API — with human-friendly
error messages, dot/`*` wildcard nesting, and conditional and cross-field rules.

## Why

- **Familiar.** Expressive string rules like `required|email|max:255` and
  `users.*.email` behave exactly as you'd expect.
- **Universal.** The core has no DOM dependency, so it runs the same on a Node
  backend (Express, NestJS, Fastify), in the browser, in a web worker, or on
  the edge.
- **Two APIs, one engine.** Validate a whole payload with
  [`Validator.make(data, rules)`](/guide/dataset-validation), or compose a
  single-field rule for Quasar/Vue with the
  [fluent builder](/guide/fluent-builder). Both share the same engine, so they
  behave identically.
- **Safe.** 100% TypeScript with **no `any`**, compiled under the strictest
  settings, linted with type-aware rules, and covered by a **100%** test suite.

## The two APIs

```ts
import { Validator, validation } from '@anil-labs/validator'

// 1. Dataset validation (server or client)
const v = Validator.make({ email: 'a@b.com' }, { email: 'required|email' })
v.passes() // true

// 2. Fluent single-field builder (Quasar/Vue :rules)
const rule = validation.required().email().toRule()
rule('a@b.com') // true
rule('nope') // "The value field must be a valid email address."
```

## What's covered

Every rule in the
[Available Validation Rules](/rules) list is implemented, plus:

- `MessageBag`, `validated()`, `safe()`, custom messages / attributes / values
- `:attribute`, `:input`, `:other`, `:value`, `:values`, size placeholders, and
  array `:index` / `:position` / `:ordinal-position`
- `sometimes`, `bail`, `nullable`, `exclude*`, the `sometimes()` method, and
  `after()` hooks
- Rule objects (`Rule.in`, `Rule.enum`, `Rule.anyOf`, `Rule.forEach`,
  `Rule.exists`/`unique`, `Rule.dimensions`) and fluent builders (`Rule.string`,
  `Rule.date`, `Rule.email`, `Password`, `FileRule`)

## Not included (server-framework concerns)

Because this is a standalone library, server-framework features tied to the HTTP
layer are intentionally out of scope: Form Requests, `authorize()`, template
`@error` directives, `old()` repopulation, session flashing, route-model
binding, and translation publishing. You can build these on top using the
primitives this library provides.

Continue to [Installation →](/guide/installation)
