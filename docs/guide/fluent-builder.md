# Fluent builder

For single-field validation, use the chainable `validation` builder. It produces
a `(value) => true | string` function — the shape most form libraries expect
(Quasar's `:rules`, vee-validate, React Hook Form's `validate`, an Angular
`ValidatorFn`, …) — and composes the same engine as `Validator`, so behavior
matches exactly.

> Framework wiring: [Vue](/guide/vue) · [React](/guide/react) ·
> [Svelte](/guide/svelte) · [SolidJS](/guide/solid) · [Angular](/guide/angular).

```vue
<script setup lang="ts">
import { validation } from '@anil-labs/validator'
</script>

<template>
  <q-input v-model="email" :rules="[validation.required().email().toRule()]" />

  <!-- .toRule() is optional — a chain is directly callable -->
  <q-input v-model="age" :rules="[validation.required().integer().between(1, 120)]" />
</template>
```

## Chaining

Every rule returns the builder, so chain freely and finish with `.toRule()`
(or pass the chain directly):

```ts
validation.required().email().maxLength(255).toRule()
validation.nullable().numeric().between(0, 9.9).toRule()
validation.bail().required().min(8).toRule()
```

## Modifiers

| Method | Effect |
| --- | --- |
| `.nullable()` | Skip the rest if the value is empty/null |
| `.bail()` / `.stopAfterFirstError()` | Stop at the first failure |
| `.sometimes()` | Only validate when present |
| `.attribute(name)` | Set the `:attribute` label in messages |
| `.withMessages({ rule: '...' })` | Per-rule custom messages |

## Available methods

The builder mirrors the dataset rules, e.g.:

- **Presence:** `required`, `filled`, `present`, `missing`, `prohibited`
- **Strings:** `string`, `alpha(ascii?)`, `alphaDash`, `alphaNum`, `email`,
  `url`, `uuid`, `ulid`, `hexColor`, `maxLength`, `minLength`, `startsWith`,
  `endsWith`, `regex`, `notRegex`, …
- **Numbers:** `numeric`, `integer`, `min`, `max`, `between`, `gt/gte/lt/lte`,
  `digits`, `decimal`, `multipleOf`, …
- **Dates:** `date`, `dateFormat`, `before`, `after`, `timezone`, `asDateOfBirth`
- **Arrays/files:** `array`, `distinct`, `inArray`, `file`, `image`, `mimes`, …
- **Cross-field:** `same(value)`, `different(value)`, `confirmed(value)`,
  `in(...)`, `notIn(...)`, `enum(values)`
- **Misc:** `ip`, `ipv4`, `ipv6`, `json`, `macAddress`, `size`, `password`,
  `strongPassword`, `asPhoneNumber`, `notEmpty`

Cross-field rules capture the **other value at build time** — pass the actual
value (reactive in a component):

```ts
validation.confirmed(passwordConfirmation)
validation.same(otherValue)
validation.requiredIf(otherFieldValue, 'expected')
```

## Custom rules

```ts
// inline
validation.required().custom((v) => String(v).startsWith('HC-') || 'Must start with HC-')

// reusable (register once)
validation.extend('nepaliPhone', (v) =>
  /^(\+977)?9[78]\d{8}$/.test(String(v)) || 'Invalid phone.',
)
validation.required().rule('nepaliPhone')
```

## Static vs instance

Both forms work:

```ts
validation.required().email() // static entry
new validation().required().email() // instance entry (ValidationBuilder)
```
