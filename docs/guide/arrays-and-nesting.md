# Arrays & nested data

## Dot notation

Validate nested fields with dots:

```ts
Validator.make(
  { photos: { profile: file } },
  { 'photos.profile': 'required|image' },
)
```

## Wildcards

Use `*` to validate every element of an array:

```ts
Validator.make(
  { users: [{ email: 'a@b.com' }, { email: 'nope' }] },
  {
    'users.*.email': 'required|email',
    'users.*.first_name': 'required_with:users.*.last_name',
  },
)
```

Each `*` is expanded against the data, so errors are keyed by the concrete
attribute (`users.1.email`). Cross-field parameters that contain `*` are
substituted with the current element's index automatically.

## The `array` rule and allowed keys

`array` can restrict which keys may appear:

```ts
Validator.make({ user: { name: 'Ada', admin: true } }, {
  user: 'array:name,username', // fails  `admin` is not allowed
})
```

## Per-element rules with `Rule.forEach`

When the rules for an element depend on its value, use `Rule.forEach`. The
callback receives the element value and its fully-expanded attribute name, and
returns the rules for that element:

```ts
import { Rule } from '@anil-labs/validator'

Validator.make(data, {
  'companies.*.id': Rule.forEach((value, attribute) => [
    'integer',
    Rule.exists('companies', 'id'),
  ]),
})
```

## Error message indexes & positions {#error-message-indexes-positions}

Reference the failing element in custom messages with `:index` (from `0`),
`:position` (from `1`), or `:ordinal-position` (`1st`, `2nd`, …):

```ts
Validator.make(
  { photos: [{ description: 'ok' }, { description: '' }] },
  { 'photos.*.description': 'required' },
  { 'photos.*.description.required': 'Please describe photo #:position.' },
)
// "Please describe photo #2."
```

For deeper nesting, use `second-index` / `second-position`,
`third-index` / `third-position`, etc.:

```ts
{ 'a.*.b.*.c.required': 'Item :second-position is invalid.' }
```

## Distinct values

```ts
Validator.make(data, { 'tags.*.id': 'distinct' }) // no duplicate ids
// options: distinct:strict, distinct:ignore_case
```
