# Async & database rules

Some rules check a database or network: `exists`, `unique`,
`current_password`, the `dns` email style, and `Password.uncompromised()`.
Because this library is framework-agnostic, those defer to **pluggable
resolvers** that you provide.

## Providing resolvers

```ts
const v = Validator.make(data, { email: 'required|email|unique:users' }).withResolvers({
  exists: async (query) => /* return whether the value(s) exist */,
  unique: async (query) => /* return whether the value is unique */,
  currentPassword: async (password, guard) => /* matches the current user? */,
  compromised: async (password) => /* breach count (number) */,
  activeUrl: async (host) => /* does the host resolve? */,
})

if (await v.failsAsync()) {
  // ...
}
```

Register them once globally instead:

```ts
Validator.setGlobalResolvers({ exists, unique })
```

## The query object

`exists` and `unique` receive a normalized `DatabaseQuery`:

```ts
interface DatabaseQuery {
  table: string
  column: string // defaults to the field's last segment
  value: unknown
  values: readonly unknown[] // value(s) — array when validating arrays
  attribute: string
  ignore?: { id: unknown; column: string } // from Rule.unique().ignore()
  wheres: ReadonlyArray<{ column: string; value: unknown }> // from .where()
}
```

Example against a SQL-ish data layer:

```ts
withResolvers({
  unique: async (q) => {
    let rows = await db(q.table).where(q.column, q.value)
    for (const w of q.wheres) rows = rows.where(w.column, w.value)
    if (q.ignore) rows = rows.whereNot(q.ignore.column, q.ignore.id)
    return (await rows.count()) === 0
  },
})
```

## Fluent exists / unique

```ts
import { Rule } from '@anil-labs/validator'

Validator.make(data, {
  email: ['required', Rule.unique('users').ignore(user.id).where('account_id', 1)],
  state: [Rule.exists('states', 'abbreviation')],
})

Rule.unique('users').withoutTrashed() // adds a deleted_at = null where
Rule.unique('users').withoutTrashed('archived_at')
```

## Sync vs async

If **no** resolver is configured, `exists`/`unique`/`current_password`
**pass** (with a one-time console warning) so a missing resolver never blocks a
form. When a resolver *is* configured the rule becomes asynchronous — always use
`passesAsync()` / `failsAsync()` / `validateAsync()`.

::: tip
Calling a synchronous method while an async rule is pending throws a clear error
pointing you to the async API.
:::
