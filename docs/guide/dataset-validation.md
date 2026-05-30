# Dataset validation

`Validator.make(data, rules, messages?, attributes?)` is the heart of the
library — a faithful, strongly-typed dataset validator.

```ts
import { Validator } from '@anil-labs/validator'

const validator = Validator.make(data, rules, customMessages, customAttributes)
```

| Argument | Type | Purpose |
| --- | --- | --- |
| `data` | `Record<string, unknown>` | The payload under validation |
| `rules` | `Record<string, string \| array>` | Rules per (dot/`*`) field |
| `messages` | `Record<string, string>` | Custom messages (optional) |
| `attributes` | `Record<string, string>` | Display names (optional) |

## Defining rules

Rules may be a pipe string or an array (use the array form when a rule contains
special characters, or when mixing in rule objects/closures):

```ts
Validator.make(data, {
  title: 'required|string|max:255',
  body: ['required', 'string'],
  slug: ['required', (attr, value, fail) => { /* closure */ }],
})
```

Rules run **in order**; add [`bail`](/rules#bail) to stop a field at its first
failure.

## Running validation

| Method | Returns |
| --- | --- |
| `passes()` | `boolean` |
| `fails()` | `boolean` |
| `validate()` | validated data, or throws `ValidationException` |
| `errors()` | [`MessageBag`](/api#messagebag) |
| `validated()` | the validated subset of `data` |
| `safe()` | [`ValidatedInput`](/api#validatedinput) |

Async equivalents — use these whenever a rule needs a
[resolver](/guide/async-rules):

| Sync | Async |
| --- | --- |
| `passes()` | `passesAsync()` |
| `fails()` | `failsAsync()` |
| `validate()` | `validateAsync()` |

::: tip
Calling a sync method (`passes()`) when an async rule is present throws a clear
error telling you to use the async API.
:::

## Nested attributes

Use "dot" notation for nested fields, and escape a literal dot with `\.`:

```ts
Validator.make(
  { author: { name: '' }, 'v1.0': 'x' },
  {
    'author.name': 'required',
    'v1\\.0': 'required', // literal "v1.0" key
  },
)
```

See [Arrays & nested data](/guide/arrays-and-nesting) for `*` wildcards.

## Stopping on the first failure

```ts
const v = Validator.make(data, rules).stopOnFirstFailure()
v.fails() // stops after the first failing attribute
```

## After hooks

Run extra logic once the main pass completes — accepts a callback, an array, or
invokable objects (`{ __invoke }`):

```ts
Validator.make(data, rules).after((validator) => {
  if (somethingElseIsInvalid) {
    validator.errors().add('field', 'Something is wrong with this field!')
  }
})
```

## Conditional rules at runtime

`sometimes()` adds rules only when a closure returns `true`:

```ts
const v = Validator.make(data, { games: 'required|integer' })

v.sometimes('reason', 'required|max:500', (input) => Number(input.games) >= 100)

// multiple fields, or array elements via `*` (with the current item):
v.sometimes('channels.*.address', 'email', (input, item) => item.type === 'email')
```

## Custom config

```ts
Validator.make(data, rules)
  .setCustomMessages({ 'email.required': 'We need your email!' })
  .setAttributeNames({ email: 'email address' })
  .setValueMap({ payment_type: { cc: 'credit card' } })
  .withResolvers({ unique: myUniqueResolver })
```

You can also register resolvers once, globally:

```ts
Validator.setGlobalResolvers({ unique: myUniqueResolver })
```
