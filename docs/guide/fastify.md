# Fastify

Validate in a `preHandler` (or `preValidation`) hook. This complements Fastify's
built-in JSON-Schema validation when you want expressive, message-rich rules and
async DB checks.

## A reusable hook

```ts
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

export function validate(schema: RulesSchema): preHandlerHookHandler {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const v = Validator.make(req.body as Record<string, unknown>, schema)
    if (await v.failsAsync()) {
      reply.code(422).send({ errors: v.errors().messages() })
      return reply // returning the reply halts the lifecycle
    }
    req.body = v.validated()
  }
}
```

```ts
fastify.post(
  '/users',
  { preHandler: validate({ email: 'required|email|unique:users', password: 'required|min:8' }) },
  async (req) => db.users.create(req.body),
)
```

## Global resolvers

```ts
import { Validator } from '@anil-labs/validator'

Validator.setGlobalResolvers({
  unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
})
```

For typed bodies, declare your TS types separately — this validator works on the
runtime payload and returns `validated()` as the trusted object.
