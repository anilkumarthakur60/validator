# Error messages

## The MessageBag

`errors()` returns a `MessageBag`:

```ts
const bag = validator.errors()

bag.first() // first message overall
bag.first('email') // first message for a field ('' if none)
bag.get('email') // all messages for a field
bag.get('attachments.*') // wildcard lookup
bag.has('email') // boolean
bag.hasAny(['a', 'b']) // any of these keys?
bag.missing('email') // no messages for this key?
bag.any() // any messages at all?
bag.all() // every message, flattened
bag.keys() // keys that have messages
bag.messages() // { field: [messages] }
bag.count() // total messages
```

## Custom messages

Pass messages as the third argument to `Validator.make`, or via
`setCustomMessages`. Use `rule` for a global override or `attribute.rule` for a
specific field:

```ts
Validator.make(data, rules, {
  required: 'The :attribute field is required.', // every "required"
  'email.required': 'We need to know your email address!', // email's "required"
  'email.max': 'Your email is too long!',
})
```

## Placeholders

Messages support these placeholders:

| Placeholder | Replaced with |
| --- | --- |
| `:attribute` | The field's display name |
| `:input` | The field's current value |
| `:other` | A referenced field's display name (`same`, `required_if`, …) |
| `:value` | A comparison value (`gt`, `required_if`, …) |
| `:values` | A comma-joined list (`in`, `required_with`, …) |
| `:min` / `:max` / `:size` | Size-rule bounds |
| `:digits` / `:format` / `:decimal` | Rule-specific |

Capitalization is honored: `:Attribute` → `Name`, `:ATTRIBUTE` → `NAME`.

```ts
Validator.make({ age: 200 }, { age: 'max:100' }, {
  'age.max': 'The :attribute value :input exceeds :max.',
})
// "The age value 200 exceeds 100."
```

## Customizing attribute names

```ts
Validator.make(data, { email: 'required' }, {}, { email: 'email address' })
// "The email address field is required."
```

Wildcard attribute names work too:

```ts
.setAttributeNames({ 'users.*.email': 'user email' })
```

## Customizing displayed values

Some messages include `:value` (the current value of another field). Map raw
values to friendly text with `setValueMap`:

```ts
Validator.make({ payment_type: 'cc', cc_number: '' }, {
  cc_number: 'required_if:payment_type,cc',
}).setValueMap({ payment_type: { cc: 'credit card' } })
// "The cc number field is required when payment type is credit card."
```

## Type-aware size messages

`min`, `max`, `between`, `size`, `gt`, `gte`, `lt`, `lte` choose their wording
from the value's type (numeric / string / array / file):

```ts
Validator.make({ n: 5 }, { n: 'numeric|max:3' }).errors().first('n')
// "The n field must not be greater than 3."
Validator.make({ n: 'abcd' }, { n: 'string|max:3' }).errors().first('n')
// "The n field must not be greater than 3 characters."
Validator.make({ n: [1, 2, 3, 4] }, { n: 'array|max:3' }).errors().first('n')
// "The n field must not have more than 3 items."
```

## Overriding the defaults globally

`defaultMessages` is exported and mutable — change copy app-wide at startup:

```ts
import { defaultMessages } from '@anil-labs/validator'

defaultMessages.required = 'This field cannot be empty.'
defaultMessages.email = 'Please enter a valid email address.'
```

## Array indexes & positions

See [Arrays & nested data → indexes and positions](/guide/arrays-and-nesting#error-message-indexes-positions).
