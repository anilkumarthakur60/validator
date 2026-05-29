# Demo — @hc/validation

A standalone Vite app that showcases both APIs of the validation library
(imported via the `@` alias, which maps to `../src`).

- **Live field validation** — the email input uses the fluent builder
  (`validation.nullable().email()`).
- **Whole-form validation** — submitting runs the dataset
  `Validator.make(data, schema)` (with `confirmed`, `between`, custom attribute
  names) and renders `errors()` / `validated()`.

## Run

From the repo root:

```bash
npm run demo         # dev server
npm run demo:build   # production build → dist/demo
```
