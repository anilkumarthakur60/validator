# Using with Vue

The fluent builder returns a `(value) => true | string` function  the exact
shape Quasar's `:rules` and most Vue form libraries expect. The dataset
`Validator` handles whole-form validation. Nothing Vue-specific to install.

## Quasar `:rules`

A builder chain is directly callable, so pass it straight to `:rules`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { validation } from '@anil-labs/validator'

const email = ref('')
const age = ref('')
</script>

<template>
  <q-input v-model="email" :rules="[validation.required().email()]" />
  <q-input v-model="age" :rules="[validation.required().integer().between(1, 120)]" />
</template>
```

See the [fluent builder reference](/guide/fluent-builder) for every method.

## A reusable `useField` composable

For non-Quasar inputs, wrap a value + rule into reactive state:

```ts
import { computed, ref, type Ref } from 'vue'
import type { FieldRuleFn } from '@anil-labs/validator'

export function useField(initial: string, rule: FieldRuleFn) {
  const value = ref(initial)
  const touched = ref(false)
  const result = computed(() => rule(value.value))
  const valid = computed(() => result.value === true)
  return {
    value,
    touched,
    valid,
    error: computed(() => (result.value === true ? '' : result.value)),
    showError: computed(() => touched.value && !valid.value),
  }
}
```

```vue
<script setup lang="ts">
import { validation } from '@anil-labs/validator'
import { useField } from './useField'

const email = useField('', validation.required().email().toRule())
</script>

<template>
  <input v-model="email.value.value" @blur="email.touched.value = true" />
  <p v-if="email.showError.value" class="error">{{ email.error.value }}</p>
</template>
```

## Whole-form validation

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema } from '@anil-labs/validator'

const form = reactive({ email: '', password: '', password_confirmation: '' })
const errors = ref<Record<string, string[]>>({})

const schema: RulesSchema = {
  email: 'required|email',
  password: 'required|min:8|confirmed',
}

function submit() {
  const v = Validator.make(form, schema)
  if (v.fails()) {
    errors.value = v.errors().messages()
    return
  }
  errors.value = {}
  // v.validated() is the clean, rule-checked payload
  void api.signup(v.validated())
}
</script>
```

## vee-validate

`useField`'s validator accepts a function returning `true | string`, so a builder
chain drops straight in:

```ts
import { useField } from 'vee-validate'
import { validation } from '@anil-labs/validator'

const { value, errorMessage } = useField('email', validation.required().email())
```

For a whole-form schema, map `Validator` errors in a custom `validate` handler.

## Notes

- Build chains once where possible; cross-field rules (`confirmed`, `same`,
  `requiredIf`) capture the other value **at build time**. For reactive
  cross-field checks, validate the whole form with `Validator.make`, which
  always sees current data.
- Works the same in Nuxt (client and server), Vite, and Vue CLI apps.
