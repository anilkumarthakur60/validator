# NestJS

Wrap the validator in a `PipeTransform` so any handler can validate its body
with a schema, then receive the clean `validated()` object.

## A `ValidateBody` pipe

```ts
import { Injectable, PipeTransform, UnprocessableEntityException } from '@nestjs/common'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

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
```

```ts
@Post()
create(
  @Body(new ValidateBody({ email: 'required|email|unique:users', password: 'required|min:8' }))
  body: Record<string, unknown>,
) {
  return this.users.create(body)
}
```

## Register resolvers at bootstrap

```ts
import { Validator } from '@anil-labs/validator'

Validator.setGlobalResolvers({
  unique: async (q) => (await db.count(q.table, { [q.column]: q.value })) === 0,
  exists: async (q) => (await db.count(q.table, { [q.column]: q.value })) > 0,
  currentPassword: async (plain) => bcrypt.compare(plain, currentUser.passwordHash),
})
```

The `UnprocessableEntityException` already serializes to a `422` with your
`{ errors }` payload; add an exception filter if you want a different shape.
