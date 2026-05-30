# Installation

```bash
npm install @hc/validation
# or
pnpm add @hc/validation
# or
yarn add @hc/validation
```

The package ships **ESM and CommonJS** with bundled type declarations, so it
works in any modern toolchain.

## Requirements

- **Node ≥ 18** for server usage. File rules (`file`, `image`, `mimes`, `size`)
  rely on the global `File`, which is stable from **Node 20**.
- Any bundler (Vite, webpack, esbuild, Rollup) or TypeScript ≥ 5 for the
  browser.

## Importing

```ts
// ESM
import { Validator, Rule, validation } from '@hc/validation'

// CommonJS
const { Validator } = require('@hc/validation')
```

Everything is exported from the package root:

```ts
import {
  Validator,
  MessageBag,
  ValidatedInput,
  ValidationException,
  validation, // fluent builder
  Rule, // rule-object facade
  Password,
  FileRule,
  StringRule,
  DateRule,
  EmailRule,
  Enum,
  Dimensions,
  ExistsRule,
  UniqueRule,
  AnyOf,
  registerRule,
  defaultMessages,
} from '@hc/validation'
```

Continue to [Quick start →](/guide/quickstart)
