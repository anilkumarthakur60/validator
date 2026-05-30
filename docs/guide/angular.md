# Using with Angular

Adapt the builder to Angular's `ValidatorFn` / `AsyncValidatorFn` contracts, or
validate a whole `FormGroup` value with the dataset `Validator`.

## A `ValidatorFn` from any builder chain

```ts
import type { AbstractControl, ValidatorFn } from '@angular/forms'
import type { FieldRuleFn } from '@anil-labs/validator'

/** Wrap a fluent rule as an Angular synchronous validator. */
export function ruleValidator(rule: FieldRuleFn): ValidatorFn {
  return (control: AbstractControl) => {
    const result = rule(control.value)
    return result === true ? null : { validation: result }
  }
}
```

```ts
import { FormControl } from '@angular/forms'
import { validation } from '@anil-labs/validator'
import { ruleValidator } from './rule-validator'

email = new FormControl('', {
  validators: [ruleValidator(validation.required().email().toRule())],
})
```

```html
<input [formControl]="email" />
@if (email.errors?.['validation']; as message) {
  <p class="error">{{ message }}</p>
}
```

## Async validator (unique / exists)

```ts
import type { AsyncValidatorFn } from '@angular/forms'
import { Validator } from '@anil-labs/validator'

export function uniqueEmail(check: (email: string) => Promise<boolean>): AsyncValidatorFn {
  return async (control) => {
    const v = Validator.make(
      { email: control.value },
      { email: 'required|email|unique:users' },
    ).withResolvers({ unique: (q) => check(String(q.value)) })

    return (await v.failsAsync()) ? { unique: v.errors().first('email') } : null
  }
}
```

## Validating a whole `FormGroup`

```ts
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

const schema: RulesSchema = {
  email: 'required|email',
  password: 'required|min:8|confirmed',
}

submit() {
  const v = Validator.make(this.form.getRawValue(), schema)
  if (v.fails()) {
    // map errors back onto controls
    for (const [name, messages] of Object.entries(v.errors().messages())) {
      this.form.get(name)?.setErrors({ server: messages[0] })
    }
    return
  }
  this.api.signup(v.validated())
}
```

The async API + [resolvers](/guide/async-rules) work the same in Angular SSR /
server code.
