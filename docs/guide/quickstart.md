# Quick start

## Validate a payload

Pass the data and a rules map to `Validator.make`. Rules can be a
`|`-delimited string or an array.

```ts
import { Validator } from '@anil-labs/validator'

const validator = Validator.make(
  { title: 'Hello', body: '', tags: ['a', 'a'] },
  {
    title: 'required|string|max:255',
    body: ['required'],
    tags: 'array|distinct',
  },
)

validator.passes() // false
validator.fails() // true
```

## Read the errors

`errors()` returns a [`MessageBag`](/api#messagebag).

```ts
const bag = validator.errors()
bag.first('body') // "The body field is required."
bag.get('tags') // ["The tags field has a duplicate value."]
bag.all() // every message, flattened
bag.messages() // { body: [...], tags: [...] }
```

## Get the validated data

```ts
if (validator.passes()) {
  const clean = validator.validated() // only the keys that had rules
  const subset = validator.safe().only(['title']) // ValidatedInput helpers
}
```

## Throw on failure

`validate()` returns the validated data, or throws a
[`ValidationException`](/api#validationexception) (status `422`):

```ts
import { ValidationException } from '@anil-labs/validator'

try {
  const data = validator.validate()
} catch (e) {
  if (e instanceof ValidationException) {
    e.errors() // { field: [messages] }
  }
}
```

## Async rules

When a field uses `exists`, `unique`, `current_password`, or
`Password.uncompromised()`, use the async API and supply
[resolvers](/guide/async-rules):

```ts
const v = Validator.make({ email: 'a@b.com' }, { email: 'required|email|unique:users' })
  .withResolvers({ unique: async (q) => !(await api.exists(q.table, q.column, q.value)) })

if (await v.failsAsync()) {
  // ...
}
```

## Single-field rules (Quasar / Vue)

```ts
import { validation } from '@anil-labs/validator'

const rules = [validation.required().email().maxLength(255).toRule()]
rules[0]('a@b.com') // true
```

Next: [Dataset validation →](/guide/dataset-validation)
