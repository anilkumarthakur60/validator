# Using with React

The core is framework-agnostic, and the fluent builder produces a plain
`(value) => true | string` function — which is exactly the shape React forms
(and React Hook Form) want. There's nothing React-specific to install.

Two patterns, same as everywhere else:

- **Single field** → the `validation` builder, run inside a small hook.
- **Whole form** → `Validator.make(data, schema)` on submit.

## A reusable `useField` hook

```tsx
import { useMemo, useState } from 'react'
import { validation } from '@anil-labs/validator'
import type { FieldRuleFn } from '@anil-labs/validator'

export function useField(initial: string, rule: FieldRuleFn) {
  const [value, setValue] = useState(initial)
  const [touched, setTouched] = useState(false)

  const result = rule(value) // true | string
  const valid = result === true

  return {
    value,
    setValue,
    onBlur: () => setTouched(true),
    valid,
    error: valid ? '' : result,
    showError: touched && !valid,
  }
}
```

```tsx
function SignupFields() {
  // Build the rule once — building has cost, and cross-field rules capture
  // sibling values at build time.
  const emailRule = useMemo(() => validation.required().email().toRule(), [])
  const email = useField('', emailRule)

  return (
    <label>
      Email
      <input
        type="email"
        value={email.value}
        onChange={(e) => email.setValue(e.target.value)}
        onBlur={email.onBlur}
        aria-invalid={email.showError}
      />
      {email.showError && <p className="error">{email.error}</p>}
    </label>
  )
}
```

## Whole-form validation on submit

Validate the entire payload with `Validator.make`, then read `errors()` or the
clean `validated()` output.

```tsx
import { useState } from 'react'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

const schema: RulesSchema = {
  name: 'required|string|max:255',
  email: 'required|email',
  password: 'required|min:8|confirmed',
}

const blank = { name: '', email: '', password: '', password_confirmation: '' }

export function SignupForm() {
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const v = Validator.make(form, schema, {}, { password_confirmation: 'password confirmation' })
    if (v.fails()) {
      setErrors(v.errors().messages())
      return
    }
    setErrors({})
    // v.validated() is the trimmed, rule-checked payload — send that.
    void api.signup(v.validated())
  }

  return (
    <form onSubmit={submit} noValidate>
      <input {...field('name')} placeholder="Name" />
      {errors.name?.[0] && <p className="error">{errors.name[0]}</p>}

      <input {...field('email')} type="email" placeholder="Email" />
      {errors.email?.[0] && <p className="error">{errors.email[0]}</p>}

      <input {...field('password')} type="password" placeholder="Password" />
      <input {...field('password_confirmation')} type="password" placeholder="Confirm" />
      {errors.password?.[0] && <p className="error">{errors.password[0]}</p>}

      <button type="submit">Create account</button>
    </form>
  )
}
```

## React Hook Form

A builder chain is directly callable and returns `true | string`, which is
exactly React Hook Form's `validate` contract — so you can pass it straight in,
no adapter needed:

```tsx
import { useForm } from 'react-hook-form'
import { validation } from '@anil-labs/validator'

function Form() {
  const { register, handleSubmit, formState } = useForm<{ email: string }>()

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      {/* the chain IS the validate function */}
      <input {...register('email', { validate: validation.required().email() })} />
      {formState.errors.email && <span>{formState.errors.email.message}</span>}
    </form>
  )
}
```

Prefer one schema for the whole form? Wrap `Validator.make` in a resolver:

```ts
import type { Resolver } from 'react-hook-form'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

export const validatorResolver =
  <T extends Record<string, unknown>>(schema: RulesSchema): Resolver<T> =>
  (values) => {
    const v = Validator.make(values, schema)
    if (v.passes()) return { values, errors: {} }
    const errors = Object.fromEntries(
      Object.entries(v.errors().messages()).map(([name, msgs]) => [
        name,
        { type: 'validation', message: msgs[0] },
      ]),
    )
    return { values: {}, errors: errors as never }
  }

// useForm({ resolver: validatorResolver(schema) })
```

## Async / unique checks

Resolver-backed rules (`unique`, `exists`, `Password.uncompromised()`) run on the
async path. Debounce the input and discard stale responses:

```tsx
import { useEffect, useState } from 'react'
import { Validator } from '@anil-labs/validator'

function useUniqueEmail(email: string) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (email.trim() === '') return
    let cancelled = false
    const id = setTimeout(() => {
      const v = Validator.make(
        { email },
        { email: 'required|email|unique:users' },
      ).withResolvers({ unique: (q) => api.isEmailFree(q.value) })

      void v.failsAsync().then((failed) => {
        if (!cancelled) setMessage(failed ? v.errors().first('email') : '')
      })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [email])

  return message
}
```

See [Async & database rules](/guide/async-rules) for the resolver contracts.

## Notes

- **Build rules once.** Memoize fluent chains (`useMemo`) or define schemas at
  module scope — don't rebuild them every render.
- **Cross-field rules** capture the *other* value at build time, so for
  `confirmed`/`same`/`requiredIf` either rebuild when the dependency changes, or
  validate the whole form with `Validator.make` (which always sees current data).
- Everything here is plain TypeScript — it works the same in Next.js (client
  components), Remix, and React Native.
