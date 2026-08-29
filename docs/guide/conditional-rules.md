# Conditional rules

## Skip validation for certain values

`exclude_if` / `exclude_unless` skip a field  and drop it from
`validated()`  based on another field:

```ts
Validator.make(data, {
  has_appointment: 'required|boolean',
  appointment_date: 'exclude_if:has_appointment,false|required|date',
  doctor_name: 'exclude_unless:has_appointment,true|required|string',
})
```

Other exclusion rules: [`exclude`](/rules#exclude),
[`exclude_with`](/rules#exclude_with), [`exclude_without`](/rules#exclude_without).

### Excluding fields

A field removed by any `exclude*` rule is skipped during validation **and**
omitted from `validated()` / `safe()`.

## Validate only when present (`sometimes`)

The `sometimes` rule runs the remaining rules only if the field exists in the
data:

```ts
Validator.make(data, { email: 'sometimes|required|email' })
```

## The `sometimes()` method

For logic-based conditions, use the `sometimes()` method. The closure receives
the data; return `true` to add the rules:

```ts
const v = Validator.make(data, { games: 'required|integer|min:0' })

v.sometimes('reason', 'required|max:500', (input) => Number(input.games) >= 100)

// multiple fields at once
v.sometimes(['reason', 'cost'], 'required', (input) => Number(input.games) >= 100)
```

### Per-item array conditions

When validating arrays, the closure also receives the current item, so you can
branch on a sibling field whose index you don't know:

```ts
const data = {
  channels: [
    { type: 'email', address: 'a@b.com' },
    { type: 'url', address: 'https://example.com' },
  ],
}

v.sometimes('channels.*.address', 'email', (input, item) => item.type === 'email')
v.sometimes('channels.*.address', 'url', (input, item) => item.type !== 'email')
```

## Conditional rule objects

`Rule.requiredIf`, `Rule.requiredUnless`, `Rule.prohibitedIf`,
`Rule.prohibitedUnless`, `Rule.excludeIf`, and `Rule.excludeUnless` accept a
boolean or a closure  handy when the condition isn't another field:

```ts
import { Rule } from '@anil-labs/validator'

Validator.make(data, {
  role_id: [Rule.requiredIf(() => user.isAdmin)],
  secret: [Rule.prohibitedUnless(user.isAdmin)],
})
```

## A note on optional fields

If a field may legitimately be `null`, add `nullable` so a `null` value isn't
treated as invalid by subsequent rules:

```ts
Validator.make(data, { publish_at: 'nullable|date' })
```
