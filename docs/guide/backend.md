# Backend usage (Node)

The core engine has no DOM dependency, so it runs on any JavaScript backend or
edge runtime. The pattern is always the same:

1. Use the **async** API  `await v.failsAsync()` (or `validateAsync()`)  so
   resolver-backed rules (`unique`, `exists`, `currentPassword`,
   `Password.uncompromised()`) can hit your data layer.
2. Wire [resolvers](/guide/async-rules) once with `Validator.setGlobalResolvers`,
   or per-request with `.withResolvers()`.
3. Return `v.errors().messages()` on failure (usually HTTP `422`), and pass
   `v.validated()`  the trimmed, rule-checked object  downstream.

```ts
import { Validator } from '@anil-labs/validator'

const v = Validator.make(payload, {
  name: 'required|string|max:255',
  email: 'required|email|unique:users',
  password: 'required|min:8|confirmed',
}).withResolvers({
  unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
})

if (await v.failsAsync()) {
  // 422 with { errors: v.errors().messages() }
} else {
  await db.users.create(v.validated())
}
```

## Framework guides

- [Express](/guide/express)
- [Fastify](/guide/fastify)
- [NestJS](/guide/nestjs)
- [Hono (edge & runtimes)](/guide/hono)

The same code works in Koa, h3/Nitro (Nuxt), SvelteKit/Remix/Next.js route
handlers, and serverless functions  read the request body, call
`Validator.make`, return `errors()`/`validated()`.

## Server-side caveats

- **Files**  `file`/`image`/`mimes`/`size` need a global `File` (Node ≥ 20).
  For multipart uploads, parse with multer/busboy and check metadata with a small
  [custom rule](/guide/custom-rules).
- **Image dimensions**  `dimensions` uses the browser's `createImageBitmap`,
  absent in Node, so the rule passes. Use `sharp`/`image-size` in a custom rule
  for real server-side checks.
- Everything else (strings, numbers, dates, arrays, conditional, cross-field,
  `validated()`, `MessageBag`) is fully portable.
