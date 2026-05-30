# Installation

```bash
npm install @anil-labs/validator
# or
pnpm add @anil-labs/validator
# or
yarn add @anil-labs/validator
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
import { Validator, Rule, validation } from '@anil-labs/validator'

// CommonJS
const { Validator } = require('@anil-labs/validator')
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
} from '@anil-labs/validator'
```

Continue to [Quick start →](/guide/quickstart)
