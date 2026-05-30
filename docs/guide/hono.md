# Hono (edge & runtimes)

The core has zero Node dependencies, so it runs on Hono anywhere — Cloudflare
Workers, Deno, Bun, Vercel/Netlify edge, and Node.

## A validation middleware

```ts
import { createMiddleware } from 'hono/factory'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema, ValidationData } from '@anil-labs/validator'

export const validate = (schema: RulesSchema) =>
  createMiddleware<{ Variables: { validated: ValidationData } }>(async (c, next) => {
    const body = (await c.req.json()) as ValidationData
    const v = Validator.make(body, schema)
    if (await v.failsAsync()) {
      return c.json({ errors: v.errors().messages() }, 422)
    }
    c.set('validated', v.validated())
    await next()
  })
```

```ts
import { Hono } from 'hono'

const app = new Hono()

app.post('/users', validate({ email: 'required|email', password: 'required|min:8' }), (c) => {
  const data = c.get('validated')
  return c.json({ created: data }, 201)
})
```

## Resolvers on the edge

Register async resolvers per request (edge runtimes discourage module-level
globals) — pass them with `withResolvers` inside the middleware:

```ts
const v = Validator.make(body, schema).withResolvers({
  unique: async (q) => (await env.DB.prepare('select 1 from users where email = ?')
    .bind(q.value)
    .first()) === null,
})
```

`File`/`Blob` are available in modern edge runtimes, so file rules work; image
`dimensions` still no-ops where `createImageBitmap` is absent (see
[backend overview](/guide/backend)).
