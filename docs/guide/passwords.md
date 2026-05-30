# Validating passwords

The `Password` rule object expresses complexity requirements fluently.

```ts
import { Validator, Password } from '@hc/validation'

Validator.make(data, {
  password: ['required', 'confirmed', Password.min(8)],
})
```

## Complexity

```ts
Password.min(8) // at least 8 characters
Password.min(8).max(64) // bounded length
Password.min(8).letters() // at least one letter
Password.min(8).mixedCase() // at least one upper and one lower
Password.min(8).numbers() // at least one digit
Password.min(8).symbols() // at least one symbol

// chain them
Password.min(8).letters().mixedCase().numbers().symbols()
```

## Checking against breaches

`uncompromised()` flags passwords found in a public breach corpus. It is
**asynchronous** and needs a `compromised` resolver (return how many times the
password appears). Use the async API:

```ts
const v = Validator.make(data, {
  password: [Password.min(8).uncompromised()], // default threshold 0
}).withResolvers({
  compromised: async (password) => hibpBreachCount(password),
})

await v.passesAsync()

// allow up to N appearances:
Password.min(8).uncompromised(3)
```

## Application-wide defaults

Configure a default once, then reuse it:

```ts
Password.defaults(() =>
  isProduction ? Password.min(12).mixedCase().uncompromised() : Password.min(8),
)

// later
Validator.make(data, { password: ['required', Password.defaults()] })
```

## Attaching extra rules

```ts
import { ZxcvbnRule } from './rules' // a ValidationRuleObject or closure

Password.min(8).rules([new ZxcvbnRule()])
```

## HTML attribute

```ts
Password.min(8).letters().numbers().symbols().toPasswordRulesString()
// usable in <input passwordrules="...">
```
