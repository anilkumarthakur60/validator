# Custom rules

There are four ways to add your own rules, depending on reuse and how you want
to reference them.

## 1. Closures (one-off)

A closure receives the attribute name, value, and a `fail` callback:

```ts
Validator.make(data, {
  title: [
    'required',
    'max:255',
    (attribute, value, fail) => {
      if (value === 'foo') fail(`The ${attribute} is invalid.`)
    },
  ],
})
```

`:attribute` (and array `:position` etc.) are interpolated into the message you
pass to `fail`.

## 2. Rule objects (reusable)

Implement `ValidationRuleObject`. Add `implicit: true` to make it run even when
the value is empty/absent.

```ts
import type { ValidationRuleObject } from '@anil-labs/validator'

export class Uppercase implements ValidationRuleObject {
  validate(attribute: string, value: unknown, fail: (m: string) => void): void {
    if (String(value) !== String(value).toUpperCase()) {
      fail('The :attribute must be uppercase.')
    }
  }
}

Validator.make(data, { name: ['required', new Uppercase()] })
```

### Accessing other data / the validator

Implement `DataAwareRule` or `ValidatorAwareRule`; the engine injects them
before validating:

```ts
import type { DataAwareRule, ValidationRuleObject, ValidationData } from '@anil-labs/validator'

export class MatchesConfirmation implements ValidationRuleObject, DataAwareRule {
  private data: ValidationData = {}
  setData(data: ValidationData) {
    this.data = data
  }
  validate(attribute: string, value: unknown, fail: (m: string) => void): void {
    if (value !== this.data[`${attribute}_confirmation`]) fail('Does not match.')
  }
}
```

A rule object's `validate` may return a `Promise` for async checks  run it via
`validateAsync()`/`passesAsync()`.

## 3. Global named rules (`registerRule`)

Register once at startup; then reference it by name like a built-in
(`'slug'`, or with parameters `'slug:foo'`). The validator passes a
[`RuleContext`](/api#rulecontext):

```ts
import { registerRule, defaultMessages } from '@anil-labs/validator'
import type { BuiltinDefinition } from '@anil-labs/validator'

const slug: BuiltinDefinition = {
  validate: (ctx) => typeof ctx.value === 'string' && /^[a-z0-9-]+$/.test(ctx.value),
  // optional metadata:
  // implicit:  run even when the value is empty
  // dependent: parameters are field names (`*` is substituted)
  // replace:   contribute message placeholders
}

registerRule('slug', slug)
defaultMessages.slug = 'The :attribute must be a valid slug.'

Validator.make({ handle: 'My Slug' }, { handle: 'required|slug' })
```

With parameters:

```ts
registerRule('min_words', {
  validate: (ctx) =>
    String(ctx.value).trim().split(/\s+/).length >= Number(ctx.parameters[0] ?? 0),
})
defaultMessages.min_words = 'The :attribute must have at least :min words.'
// usage: 'bio' => 'min_words:5'
```

## 4. Fluent builder rules (`validation.extend`)

For the Quasar/Vue [fluent builder](/guide/fluent-builder):

```ts
import { validation } from '@anil-labs/validator'

validation.extend('nepaliPhone', (value) =>
  /^(\+977)?9[78]\d{8}$/.test(String(value)) || 'Invalid Nepali phone number.',
)

// use anywhere
validation.required().rule('nepaliPhone')

// inline, one-off
validation.required().custom((v) => String(v).startsWith('HC-') || 'Must start with HC-')

validation.hasRule('nepaliPhone') // true
validation.removeRule('nepaliPhone')
validation.customRuleNames()
```

## Which should I use?

| Need | Use |
| --- | --- |
| Used once | Closure |
| Reusable, may read other fields / be async | Rule object |
| String-addressable like a built-in, app-wide | `registerRule` |
| Quasar/Vue single-field builder | `validation.extend` |
