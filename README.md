# validator  @anil-labs/validator

[![CI](https://github.com/anilkumarthakur60/validator/actions/workflows/ci.yml/badge.svg)](https://github.com/anilkumarthakur60/validator/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40anil-labs%2Fvalidator.svg)](https://www.npmjs.com/package/@anil-labs/validator)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

An expressive, strictly-typed, **framework-agnostic** validation library for
TypeScript  Laravel-style string rules (`required|email|max:255`, dot & `*`
wildcard nesting) with two APIs sharing one engine:

- **`Validator.make(data, rules)`**  validate a whole dataset (server or client).
- **`validation`**  a chainable single-field rule builder for Quasar/Vue `:rules`.

Full guides live in the [docs site](https://anilkumarthakur60.github.io/validator/)
and the [package README](./packages/validator/README.md).

## Install

```bash
npm i @anil-labs/validator
```

### CDN / no build step

The package ships an IIFE bundle exposing the `Validator` global:

```html
<script src="https://unpkg.com/@anil-labs/validator"></script>
<script>
  const { Validator, validation } = window.Validator;
</script>
```

## Quick start

```ts
import { Validator, validation } from '@anil-labs/validator';

// 1. Dataset validation
const v = Validator.make(
  { email: 'not-an-email', users: [{ name: '' }] },
  { email: 'required|email', 'users.*.name': 'required|string|max:255' },
);
v.fails(); // true
v.errors().first('email'); // "The email field must be a valid email address."

// 2. Fluent single-field builder (Quasar/Vue :rules)
const rule = validation.required().email().maxLength(255).toRule();
rule('a@b.com'); // true
rule('nope'); // "The value field must be a valid email address."
```

## What's in this repo

| Directory            | Package                | What it is                                                       |
| -------------------- | ---------------------- | ----------------------------------------------------------------- |
| `packages/validator` | `@anil-labs/validator` | The library  ESM + CJS + IIFE CDN builds, bundled types.         |
| `examples/vanilla`   | `example-vanilla`      | Plain HTML + Vite example using the library directly (private).   |
| `examples/vue`       | `example-vue`          | Vue 3 + Vite showcase  forms, playground, async rules (private). |
| `docs`               | `docs`                 | VitePress docs site  guides, rules reference, API (private).     |

## Local development

Prerequisites: **Node ≥ 20** and **pnpm 10** (`corepack enable`).

```bash
git clone https://github.com/anilkumarthakur60/validator.git
cd validator
pnpm install --frozen-lockfile

pnpm example:vanilla   # run the vanilla example
pnpm example:vue       # run the Vue example
pnpm docs:dev          # run the docs site

pnpm build             # build the library (packages/validator/dist)
pnpm check             # lint + format:check + typecheck + test in one go
pnpm test:coverage     # vitest coverage run
```

## Project structure

```
validator/
├── packages/validator/          # @anil-labs/validator (the only published package)
│   ├── src/
│   │   ├── core/                #  Validator, MessageBag, ValidatedInput, parser, registry
│   │   ├── fluent/              #  validation.* chainable builder
│   │   ├── ruleObjects/         #  Rule.*, Password, FileRule, StringRule, DateRule, …
│   │   └── rules/               #  built-in rule implementations
│   └── tests/                   #  vitest suite
├── examples/                    # runnable demos (private)
│   ├── vanilla/                 #  plain HTML + Vite
│   └── vue/                     #  Vue 3 + Vite
├── docs/                        # VitePress site
├── scripts/build-demos.mjs      # assembles examples → dist-demos/
├── vercel.json                  # single Vercel project → build:demos → dist-demos
├── .github/workflows/           # CI + Docs (Pages) + Release
├── pnpm-workspace.yaml
└── package.json
```

## Deployment

Three independent targets; the only repo secret anywhere is `NPM_TOKEN`:

- **Demos → Vercel (one project).** `pnpm build:demos` assembles the examples
  into a static site under `dist-demos/`; the root `vercel.json` points a single
  Vercel project at it. Vercel's native Git integration auto-deploys `main` and
  posts preview URLs on PRs  no tokens or GitHub secrets.
- **Docs → GitHub Pages.** `.github/workflows/docs.yml` builds the VitePress
  site with `DOCS_BASE=/validator/` and deploys it on any push to `main`
  touching `docs/**`. Enable once under Settings → Pages → Source: GitHub Actions.
- **Releases → npm.** `.github/workflows/release.yml` runs
  [Changesets](https://github.com/changesets/changesets): it opens/updates a
  version PR, and publishes with provenance when it merges (needs `NPM_TOKEN`).

## Publishing to npm

1. Land your change with a changeset: `pnpm changeset` (pick the bump, write the
   summary). On `main`, the release workflow opens/updates a
   **"chore: version packages"** PR.
2. Merge that PR → the workflow builds and publishes `@anil-labs/validator` to
   npm with provenance attestation.

Manual escape hatch: `pnpm version-packages` then `pnpm release`.

## License

MIT.
