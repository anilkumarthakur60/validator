# Express

Use the **async** API (`failsAsync`) and a small middleware factory so any route
can declare a schema. Wire [resolvers](/guide/async-rules) to your data layer.

## A `validate(schema)` middleware

```ts
import type { RequestHandler } from 'express'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

export const validate =
  (schema: RulesSchema): RequestHandler =>
  async (req, res, next) => {
    const v = Validator.make(req.body as Record<string, unknown>, schema)
    if (await v.failsAsync()) {
      res.status(422).json({ errors: v.errors().messages() })
      return
    }
    req.body = v.validated() // hand the clean payload downstream
    next()
  }
```

```ts
app.post(
  '/users',
  validate({
    name: 'required|string|max:255',
    email: 'required|email|unique:users',
    password: 'required|min:8|confirmed',
  }),
  async (req, res) => {
    res.status(201).json(await db.users.create(req.body))
  },
)
```

## Register resolvers once

Set them globally at boot so every validator picks them up:

```ts
import { Validator } from '@anil-labs/validator'

Validator.setGlobalResolvers({
  unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
  exists: async (q) => (await db.count(q.table, { [q.column]: q.value })) > 0,
})
```

Make sure `express.json()` (or `urlencoded`) runs before the middleware so
`req.body` is populated. See [backend overview](/guide/backend) for file-upload
and Node-specific caveats.
