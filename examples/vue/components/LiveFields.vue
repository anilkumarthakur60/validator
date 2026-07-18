<script setup lang="ts">
import { validation } from '@/lib/fluent/builder'
import { useField } from '../composables/useField'
import CodeSnippet from './CodeSnippet.vue'

// Each chain is directly callable, so `.toRule()` is optional — we call it here
// to get a plain `(value) => true | string` function for the composable.
const email = useField('', validation.required().email().attribute('email').toRule())

const username = useField(
  '',
  validation.required().alphaDash().minLength(3).maxLength(20).attribute('username').toRule(),
)

const password = useField('', validation.strongPassword(8).attribute('password').toRule())

const age = useField('', validation.required().integer().between(18, 120).attribute('age').toRule())

const website = useField(
  '',
  validation.nullable().url('http', 'https').attribute('website').toRule(),
)

const fields = [
  {
    field: email,
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    code: `validation.required().email()`,
  },
  {
    field: username,
    label: 'Username',
    type: 'text',
    placeholder: 'ada_lovelace',
    code: `validation.required().alphaDash().minLength(3).maxLength(20)`,
  },
  {
    field: password,
    label: 'Password',
    type: 'text',
    placeholder: '8+ chars, mixed case, number, symbol',
    code: `validation.strongPassword(8)`,
  },
  {
    field: age,
    label: 'Age',
    type: 'text',
    placeholder: '18 – 120',
    code: `validation.required().integer().between(18, 120)`,
  },
  {
    field: website,
    label: 'Website (optional)',
    type: 'text',
    placeholder: 'https://example.com',
    code: `validation.nullable().url('http', 'https')`,
  },
]
</script>

<template>
  <div class="card-grid">
    <article v-for="f in fields" :key="f.label" class="card">
      <label class="field">
        <span class="field-label">{{ f.label }}</span>
        <input
          v-model="f.field.value.value"
          :type="f.type"
          :placeholder="f.placeholder"
          :class="{
            valid: f.field.valid.value && f.field.value.value !== '',
            invalid: f.field.showError.value,
          }"
          @blur="f.field.touch()"
        />
        <span class="msg" :class="f.field.valid.value ? 'ok' : 'error'">
          <template v-if="f.field.value.value === '' && !f.field.touched.value">&nbsp;</template>
          <template v-else-if="f.field.valid.value">✓ looks good</template>
          <template v-else>{{ f.field.error.value }}</template>
        </span>
      </label>
      <CodeSnippet :code="f.code" />
    </article>
  </div>
</template>
