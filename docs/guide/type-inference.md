# Type inference

When you pass a rules schema as a literal, `Validator.make` infers the shape of
the validated data — so `validated()`, `validate()`, and `safe().all()` return a
**precisely-typed object** instead of `Record<string, unknown>`.

```ts
import { Validator } from '@anil-labs/validator'

const data = Validator.make(
  {
    title: 'Hello',
    count: 5,
    author: { name: 'Ada' },
    users: [{ email: 'a@b.com' }],
    note: null,
  },
  {
    title: 'required|string|max:255',
    count: 'required|integer',
    'author.name': 'required|string',
    'users.*.email': 'required|email',
    note: 'nullable|string',
  },
).validate()

// Inferred type of `data`:
// {
//   title: string
//   count: number
//   author: { name: string }
//   users: { email: string }[]
//   note?: string | null
// }

data.title.toUpperCase() // ✅ typed
data.users[0]?.email // ✅ typed
data.count.toFixed(2) // ✅ typed
```

No `as const` is required — `make` uses a `const` type parameter to capture the
rule strings as literals.

## What gets inferred

| Rules contain… | Inferred leaf type |
| --- | --- |
| `string`, `email`, `url`, `uuid`, `date`, `ip` | `string` |
| `integer`, `numeric`, `decimal` | `number` |
| `boolean`, `accepted`, `declined` | `boolean` |
| `array` | `unknown[]` |
| (none of the above) | `unknown` |

Plus:

- **Optionality** — a field is optional (`field?:`) unless its rules include
  `required` (or `present`).
- **`nullable`** — widens the leaf with `| null`.
- **Dot paths** — `author.name` becomes `{ author: { name: … } }`.
- **Wildcards** — `users.*.email` becomes `{ users: { email: … }[] }`.
- **Rule objects / closures** contribute no token info and infer `unknown`
  (always safe).

## Inferring the type by itself

Use `InferRules` to derive the type without running validation — handy for typing
a function parameter, a store, or an API contract:

```ts
import { Validator, type InferRules } from '@anil-labs/validator'

const rules = {
  email: 'required|email',
  age: 'required|integer',
} as const

type RegisterInput = InferRules<typeof rules>
// { email: string; age: number }

function register(input: RegisterInput) {
  /* fully typed */
}

const v = Validator.make(payload, rules)
if (v.fails()) throw new Error('invalid')
register(v.validated()) // ✅ types line up
```

## A note on coercion

The engine **validates but does not coerce** — `validated()` returns your
original values. Inferred types therefore reflect each rule's *intended* type:

- For already-typed inputs (JSON payloads, server data) the inference is exact.
- For **string-form inputs** (HTML forms), a field with `integer`/`numeric` or
  `boolean` rules may still hold a **string** at runtime. Cast at the edge (or
  pre-coerce the form values) when you need the runtime value to match the type.

```ts
// From an HTML form, `age` arrives as the string "30":
const { age } = Validator.make({ age: '30' }, { age: 'required|integer' }).validate()
// `age` is typed `number`, but the runtime value is "30".
const realAge = Number(age) // coerce when you need the number
```

## Non-literal schemas

If the rules object isn't a literal (e.g. it's typed `Record<string, string>` or
built dynamically), inference can't read the rule strings and gracefully falls
back to `Record<string, unknown>`:

```ts
const dynamic: Record<string, string> = loadRules()
const out = Validator.make(payload, dynamic).validated()
// out: Record<string, unknown>
```
