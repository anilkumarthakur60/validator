# Working with validated input

After validation you usually want just the data that actually had rules — not
the entire payload. Two methods give you that.

## validated()

Returns a plain object containing only the validated keys (excluding any field
removed by an [`exclude*`](/guide/conditional-rules#excluding-fields) rule, and
any field that was absent):

```ts
const validator = Validator.make(
  { title: 'Hi', body: 'Yo', extra: 'ignored' },
  { title: 'required', body: 'required' },
)

validator.validated() // { title: 'Hi', body: 'Yo' } — `extra` dropped
```

## safe()

Returns a `ValidatedInput` wrapper with convenient accessors:

```ts
const safe = validator.safe()

safe.all() // the whole validated object
safe.only(['title']) // { title: 'Hi' }
safe.except(['title']) // { body: 'Yo' }
safe.has('title') // true (dot-aware)
safe.get('title', 'fallback') // 'Hi'
safe.merge({ author: 'Ada' }) // new ValidatedInput with extra data

for (const [key, value] of safe) {
  // iterable
}
```

## Throwing & catching

```ts
import { ValidationException } from '@hc/validation'

try {
  const data = validator.validate() // returns validated() or throws
} catch (e) {
  if (e instanceof ValidationException) {
    e.status // 422
    e.errors() // { field: [messages] }
    e.validator.errors() // the underlying MessageBag
  }
}
```

The async form is `await validator.validateAsync()`.
