# Using with Svelte

Plain functions and a framework-agnostic core make Svelte integration trivial —
no adapter needed.

## Single field (Svelte 5 runes)

```svelte
<script lang="ts">
  import { validation } from '@anil-labs/validator'

  // Build the rule once.
  const emailRule = validation.required().email().toRule()

  let email = $state('')
  let touched = $state(false)

  const result = $derived(emailRule(email))
  const error = $derived(result === true ? '' : result)
</script>

<input type="email" bind:value={email} onblur={() => (touched = true)} />
{#if touched && error}
  <p class="error">{error}</p>
{/if}
```

> Svelte 4? Use a `writable` store and a reactive `$:` statement instead of
> `$state`/`$derived` — the rule call is identical.

## Whole-form validation

```svelte
<script lang="ts">
  import { Validator } from '@anil-labs/validator'
  import type { RulesSchema } from '@anil-labs/validator'

  const schema: RulesSchema = {
    email: 'required|email',
    password: 'required|min:8|confirmed',
  }

  let form = $state({ email: '', password: '', password_confirmation: '' })
  let errors = $state<Record<string, string[]>>({})

  function submit(event: SubmitEvent) {
    event.preventDefault()
    const v = Validator.make(form, schema)
    if (v.fails()) {
      errors = v.errors().messages()
      return
    }
    errors = {}
    // v.validated() is the trimmed, rule-checked payload
  }
</script>

<form onsubmit={submit}>
  <input type="email" bind:value={form.email} />
  {#if errors.email?.[0]}<p class="error">{errors.email[0]}</p>{/if}
  <button type="submit">Submit</button>
</form>
```

## SvelteKit form actions (server)

The same engine runs on the server — validate inside an action and return the
errors with `fail()`:

```ts
// +page.server.ts
import { fail } from '@sveltejs/kit'
import { Validator } from '@anil-labs/validator'

export const actions = {
  default: async ({ request }) => {
    const data = Object.fromEntries(await request.formData())
    const v = Validator.make(data, { email: 'required|email', password: 'required|min:8' })
    if (await v.failsAsync()) {
      return fail(422, { errors: v.errors().messages() })
    }
    // persist v.validated()
  },
}
```

Wire [resolvers](/guide/async-rules) for `unique`/`exists` against your DB.
