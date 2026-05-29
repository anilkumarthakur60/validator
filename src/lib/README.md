# @hc/validation

A **Laravel-compatible**, strictly-typed validation library for TypeScript. It
ships two complementary APIs that share a single engine:

1. **`Validator`** — full dataset validation, just like Laravel's
   `Validator::make($data, $rules)`. Dot/`*` wildcard notation, cross-field
   rules, `MessageBag`, `validated()`/`safe()`, custom messages & attributes,
   conditional rules, and async rules via pluggable resolvers.
2. **`validation`** — a chainable single-field builder that produces a
   Quasar-friendly `(value) => true | string` rule function. It composes the
   same engine internally, so its behavior matches the dataset API exactly.

The codebase is **100% TypeScript with zero `any`**, compiled under the
strictest settings (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, …).

---

## Architecture

```
src/lib/                  ← the library (imported via `@/lib/...`)
├── index.ts              ← public barrel
├── types.ts              ← all shared contracts (no any)
├── helpers.ts            ← pure predicates (isEmail, isNumeric, parseDate, …)
├── messages.ts           ← Laravel default messages + type-aware size variants
├── core/
│   ├── Validator.ts      ← the dataset engine (Laravel parity)
│   ├── MessageBag.ts     ← error bag (first/get/has/all/messages)
│   ├── ValidatedInput.ts ← safe() wrapper (only/except/merge/iterate)
│   ├── ValidationException.ts
│   ├── RuleParser.ts     ← 'required|max:255' & array/object forms
│   ├── data.ts           ← dot get/set/has + wildcard expansion
│   ├── registry.ts       ← built-in rule registry + extension
│   └── ruleDefinition.ts ← the BuiltinDefinition contract
├── rules/                ← every built-in rule, grouped by category
│   ├── presence.ts string.ts number.ts size.ts date.ts
│   ├── boolean.ts array.ts file.ts utility.ts _shared.ts
├── ruleObjects/          ← Rule facade, Password, Enum, File, Dimensions,
│   │                       database (exists/unique), AnyOf, forEach marker
└── fluent/builder.ts     ← the chainable Quasar builder
```

---

## Dataset validation (Laravel parity)

```ts
import { Validator } from '@hc/validation'

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
  validator.errors().first('users.1.email') // "The users.1.email field must be a valid email address."
  validator.errors().all()
} else {
  const data = validator.validated() // only the validated keys
}
```

### Working with results

```ts
validator.passes() / validator.fails()
validator.validate()                 // returns validated data or throws ValidationException
validator.validated()                // plain object of validated input
validator.safe().only(['title'])     // ValidatedInput: only / except / merge / iterate
validator.errors()                   // MessageBag
```

### MessageBag

```ts
const bag = validator.errors()
bag.first()                 // first message of any field
bag.first('email')          // first message for a field
bag.get('users.*.email')    // all messages matching a wildcard
bag.all()                   // every message
bag.has('email')            // boolean
bag.messages()              // Record<string, string[]>
```

### Custom messages, attributes & values

```ts
Validator.make(
  { email: '' },
  { email: 'required' },
  { 'email.required': 'We need your :attribute!' }, // rule or attribute.rule
  { email: 'email address' },                       // :attribute display name
).setValueMap({ payment_type: { cc: 'credit card' } })
```

Array messages support `:index` (from 0), `:position` (from 1),
`:ordinal-position` (`1st`), and deeper `second-index`/`third-position`, etc.

### Conditional & flow rules

`bail`, `nullable`, `sometimes`, and `exclude` / `exclude_if` / `exclude_unless`
/ `exclude_with` / `exclude_without` are all supported, plus the runtime
`sometimes()` and `after()` hooks:

```ts
const v = Validator.make(data, { games: 'required|integer' })

v.sometimes('reason', 'required|max:500', (input) => Number(input.games) >= 100)

v.after((validator) => {
  if (somethingElseIsInvalid) {
    validator.errors().add('field', 'Something is wrong!')
  }
})

v.stopOnFirstFailure() // stop after the first failing attribute
```

---

## Rule objects (`Rule` facade)

```ts
import { Rule, Password, FileRule } from '@hc/validation'

Validator.make(data, {
  role: [Rule.in(['admin', 'editor'])],
  status: [Rule.enum(ServerStatus).only([ServerStatus.Active])],
  username: ['required', Rule.anyOf([['string', 'email'], ['string', 'alpha_dash', 'min:6']])],
  'companies.*.id': Rule.forEach((value, attribute) => ['integer', 'min:0']),
  role_id: [Rule.requiredIf(() => user.isAdmin)],
  password: ['required', 'confirmed', Password.min(8).mixedCase().numbers().symbols()],
  avatar: [FileRule.image().max('2mb').dimensions(Rule.dimensions().maxWidth(1000))],
})
```

Custom rule objects implement `ValidationRuleObject` (and optionally
`DataAwareRule` / `ValidatorAwareRule`); closures `(attribute, value, fail)`
work too.

---

## Async rules (database / network)

Rules Laravel runs against a backend (`exists`, `unique`, `current_password`,
`active_url` DNS, `Password.uncompromised()`) use **pluggable resolvers**. Use
the async API so they can be awaited:

```ts
const validator = Validator.make(data, {
  email: 'required|email|unique:users',
}).withResolvers({
  unique: async (query) => !(await api.exists(query.table, query.column, query.value)),
})

if (await validator.failsAsync()) {
  // await validator.validateAsync() throws ValidationException on failure
}
```

Resolvers can also be registered globally: `Validator.setGlobalResolvers({ … })`.
Calling the sync API (`passes()`) when an async rule is present throws a clear
error directing you to `passesAsync()`/`validateAsync()`.

---

## Fluent builder (Quasar)

```vue
<template>
  <q-input v-model="email" :rules="[validation.required().email().toRule()]" />
  <!-- .toRule() is optional — a chain is directly callable: -->
  <q-input v-model="age" :rules="[validation.required().integer().between(1, 120)]" />
</template>

<script setup lang="ts">
import { validation } from '@hc/validation'
</script>
```

### Modifiers & rules

```ts
validation.required().email().maxLength(255)
validation.nullable().numeric().between(0, 9.9)
validation.required().string().startsWith('http')
validation.bail().required().min(8)
validation.attribute('Email').required()        // controls :attribute in messages
```

Cross-field rules capture the sibling value at build time (reactive in a
component):

```ts
validation.confirmed(passwordConfirmation)
validation.same(otherValue)
validation.requiredIf(otherFieldValue, 'expected')
```

### Custom rules

```ts
// inline, one-off
validation.required().custom((v) => String(v).startsWith('HC-') || 'Must start with HC-')

// register a reusable named rule once at startup
validation.extend('nepaliPhone', (v) =>
  /^(\+977)?9[78]\d{8}$/.test(String(v)) || 'Invalid Nepali phone number.',
)
validation.required().rule('nepaliPhone')

validation.hasRule('nepaliPhone')   // true
validation.removeRule('nepaliPhone')
validation.customRuleNames()
```

---

## Supported rules

All Laravel rules are implemented:

- **Presence / flow** — required, required_if, required_if_accepted,
  required_if_declined, required_unless, required_with, required_with_all,
  required_without, required_without_all, required_array_keys, filled, present,
  present_if, present_unless, present_with, present_with_all, missing,
  missing_if, missing_unless, missing_with, missing_with_all, prohibited,
  prohibited_if, prohibited_if_accepted, prohibited_if_declined,
  prohibited_unless, prohibits, nullable, sometimes, bail, exclude, exclude_if,
  exclude_unless, exclude_with, exclude_without.
- **Strings** — string, alpha(`:ascii`), alpha_dash, alpha_num, ascii, email
  (rfc/strict/filter/spoof/dns), lowercase, uppercase, url(`:protocols`),
  active_url, uuid(`:version`), ulid, hex_color, starts_with, ends_with,
  doesnt_start_with, doesnt_end_with, regex, not_regex.
- **Numbers** — numeric(`:strict`), integer(`:strict`), decimal, digits,
  digits_between, max_digits, min_digits, multiple_of, plus the size rules
  (size, min, max, between, gt, gte, lt, lte) with type-aware messages.
- **Booleans** — boolean(`:strict`), accepted, accepted_if, declined,
  declined_if.
- **Arrays** — array(`:keys`), list, distinct(`:strict`/`:ignore_case`),
  in_array, in_array_keys, contains, doesnt_contain.
- **Dates** — date, date_format, date_equals, before, before_or_equal, after,
  after_or_equal, timezone (field references & relative dates supported).
- **Files** — file, image(`:allow_svg`), mimes, mimetypes, extensions,
  dimensions, encoding.
- **Utility / DB** — confirmed, same, different, in, not_in, json, ip, ipv4,
  ipv6, mac_address, current_password, exists, unique.
- **Rule objects** — Rule.in/notIn/contains/doesntContain, Rule.enum,
  Rule.requiredIf/requiredUnless/prohibitedIf/prohibitedUnless/excludeIf/
  excludeUnless, Rule.anyOf, Rule.forEach, Rule.exists/unique, Rule.dimensions,
  Password, FileRule.

---

## Scripts

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run test        # vitest run
npm run test:watch  # vitest
```

## License

MIT
