# Using with SolidJS

Signals + a plain `(value) => true | string` rule make for a tiny integration.

## Single field

```tsx
import { createMemo, createSignal, Show } from 'solid-js'
import { validation } from '@anil-labs/validator'

export function EmailField() {
  const rule = validation.required().email().toRule()
  const [email, setEmail] = createSignal('')
  const [touched, setTouched] = createSignal(false)

  const result = createMemo(() => rule(email()))

  return (
    <label>
      Email
      <input
        type="email"
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        onBlur={() => setTouched(true)}
      />
      <Show when={touched() && result() !== true}>
        <p class="error">{result() as string}</p>
      </Show>
    </label>
  )
}
```

## Whole-form validation

```tsx
import { createStore } from 'solid-js/store'
import { createSignal } from 'solid-js'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

const schema: RulesSchema = {
  email: 'required|email',
  password: 'required|min:8|confirmed',
}

export function SignupForm() {
  const [form, setForm] = createStore({ email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = createSignal<Record<string, string[]>>({})

  function submit(e: Event) {
    e.preventDefault()
    const v = Validator.make(form, schema)
    if (v.fails()) {
      setErrors(v.errors().messages())
      return
    }
    setErrors({})
    // send v.validated()
  }

  return (
    <form onSubmit={submit}>
      <input value={form.email} onInput={(e) => setForm('email', e.currentTarget.value)} />
      <Show when={errors().email?.[0]}>{(msg) => <p class="error">{msg()}</p>}</Show>
      <button type="submit">Submit</button>
    </form>
  )
}
```

Build rules once (outside the component, or memoized) — cross-field rules
capture sibling values at build time, so prefer `Validator.make` for reactive
cross-field checks. SolidStart server functions can use the async API with
[resolvers](/guide/async-rules).
