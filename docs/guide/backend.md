# Backend usage (Node)

The core engine has no DOM dependency, so it runs on any Node backend. Use the
**async** API and wire [resolvers](/guide/async-rules) to your real data layer.

## Express

```ts
import { Validator } from '@hc/validation'

app.post('/users', async (req, res) => {
  const v = Validator.make(req.body, {
    name: 'required|string|max:255',
    email: 'required|email|unique:users',
    password: 'required|min:8|confirmed',
  }).withResolvers({
    unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
  })

  if (await v.failsAsync()) {
    return res.status(422).json({ errors: v.errors().messages() })
  }
  return res.status(201).json(await db.users.create(v.validated()))
})
```

## NestJS

A reusable pipe:

```ts
import { PipeTransform, Injectable, UnprocessableEntityException } from '@nestjs/common'
import { Validator, type RulesSchema } from '@hc/validation'

@Injectable()
export class ValidateBody implements PipeTransform {
  constructor(private readonly rules: RulesSchema) {}

  async transform(value: unknown) {
    const v = Validator.make(value as Record<string, unknown>, this.rules)
    if (await v.failsAsync()) {
      throw new UnprocessableEntityException({ errors: v.errors().messages() })
    }
    return v.validated()
  }
}

// @Post()
// create(@Body(new ValidateBody({ email: 'required|email' })) body) { ... }
```

Register shared resolvers once at bootstrap:

```ts
import { Validator } from '@hc/validation'

Validator.setGlobalResolvers({
  unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
  exists: async (q) => (await db.count(q.table, { [q.column]: q.value })) > 0,
  currentPassword: async (plain) => bcrypt.compare(plain, currentUser.passwordHash),
  compromised: async (password) => hibpBreachCount(password),
})
```

## Server-side caveats

- **Files** — `file`/`image`/`mimes`/`size` need the global `File` (Node ≥ 20).
  For multipart uploads you usually validate via multer/busboy and then check
  metadata with a small [custom rule](/guide/custom-rules).
- **Image dimensions** — `dimensions` uses the browser's `createImageBitmap`,
  which is absent in Node, so the rule passes. Use `sharp`/`image-size` in a
  custom rule for real server-side checks.
- Everything else (strings, numbers, dates, arrays, conditional, cross-field,
  `validated()`, `MessageBag`) is fully portable.
