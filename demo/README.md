# Demo — @hc/validation

A standalone **Vue 3 + TypeScript** app (Vite, `<script setup>`) that showcases
the validation library end-to-end. The library is imported via the `@` alias,
which maps to `../src`, so the demo always runs against the live source.

## Sections

1. **Fluent builder** — chainable, Quasar-style `:rules` that validate as you
   type (`validation.required().email()`, `strongPassword()`, `nullable().url()`…).
2. **Registration form** — `Validator.make(data, schema)` over a full dataset
   with cross-field rules (`confirmed`), `nullable`, `between`, `in`, custom
   attribute names, and live `errors()` / `validated()` output.
3. **Nested arrays** — wildcard rules (`members.*.email`) on dynamically
   added/removed rows, including `distinct` and positional `:position` messages.
4. **Async rules** — a resolver-backed `unique` check with debouncing, a loading
   spinner, and stale-response cancellation via `failsAsync()`.
5. **Rule gallery** — a live cheat-sheet of builder methods across strings,
   numbers, dates, and network/format rules.
6. **Playground** — type any pipe-syntax rule string against any JSON
   value and watch it pass/fail in real time.

## Architecture

- `App.vue` — sidebar navigation + active-section host.
- `components/*.vue` — one component per section, plus `CodeSnippet`/`JsonView`.
- `composables/useField.ts` — wraps a value + a builder rule into reactive
  `valid` / `error` state.

## Run

From the repo root:

```bash
npm run demo            # dev server (http://localhost:5173)
npm run demo:build      # production build → demo/dist
npm run demo:typecheck  # vue-tsc type-check of the demo
```
