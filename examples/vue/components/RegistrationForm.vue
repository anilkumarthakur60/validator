<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema, ValidationData } from '@anil-labs/validator'
import CodeSnippet from './CodeSnippet.vue'
import JsonView from './JsonView.vue'

interface FormShape {
  name: string
  email: string
  age: string
  role: string
  website: string
  password: string
  password_confirmation: string
  terms: boolean
}

const blank = (): FormShape => ({
  name: '',
  email: '',
  age: '',
  role: '',
  website: '',
  password: '',
  password_confirmation: '',
  terms: false,
})

const form = reactive<FormShape>(blank())

const fields = [
  { name: 'name', label: 'Full name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'website', label: 'Website (optional)', type: 'text' },
  { name: 'password', label: 'Password', type: 'password' },
  { name: 'password_confirmation', label: 'Confirm password', type: 'password' },
] as const

const roles = ['admin', 'editor', 'viewer'] as const

const schema: RulesSchema = {
  name: 'required|string|min:2|max:255',
  email: 'required|email',
  age: 'required|integer|between:18,120',
  role: 'required|in:admin,editor,viewer',
  website: 'nullable|url:http,https',
  password: 'required|min:8|confirmed',
  terms: 'accepted',
}

const schemaCode = `const schema = {
  name:     'required|string|min:2|max:255',
  email:    'required|email',
  age:      'required|integer|between:18,120',
  role:     'required|in:admin,editor,viewer',
  website:  'nullable|url:http,https',
  password: 'required|min:8|confirmed',
  terms:    'accepted',
}

const v = Validator.make(data, schema)
v.fails() ? v.errors().messages() : v.validated()`

const errors = ref<Record<string, string[]>>({})
const validated = ref<ValidationData | null>(null)
const submitted = ref(false)

function buildData(): ValidationData {
  return {
    name: form.name,
    email: form.email,
    age: form.age,
    role: form.role,
    website: form.website,
    password: form.password,
    password_confirmation: form.password_confirmation,
    terms: form.terms ? 'yes' : '',
  }
}

function submit(): void {
  submitted.value = true
  const v = Validator.make(
    buildData(),
    schema,
    {},
    { password_confirmation: 'password confirmation' },
  )
  if (v.fails()) {
    errors.value = v.errors().messages()
    validated.value = null
  } else {
    errors.value = {}
    validated.value = v.validated()
  }
}

function reset(): void {
  Object.assign(form, blank())
  errors.value = {}
  validated.value = null
  submitted.value = false
}

function firstError(field: string): string {
  return errors.value[field]?.[0] ?? ''
}
</script>

<template>
  <div class="split">
    <form class="card form" novalidate @submit.prevent="submit">
      <div v-for="f in fields" :key="f.name" class="field">
        <label :for="`reg-${f.name}`" class="field-label">{{ f.label }}</label>
        <input
          :id="`reg-${f.name}`"
          v-model="form[f.name]"
          :type="f.type"
          :class="{ invalid: firstError(f.name) !== '' }"
        />
        <span class="msg error">{{ firstError(f.name) || '&nbsp;' }}</span>
      </div>

      <div class="field">
        <label for="reg-role" class="field-label">Role</label>
        <select id="reg-role" v-model="form.role" :class="{ invalid: firstError('role') !== '' }">
          <option value="" disabled>Select a role…</option>
          <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
        </select>
        <span class="msg error">{{ firstError('role') || '&nbsp;' }}</span>
      </div>

      <label class="check">
        <input v-model="form.terms" type="checkbox" />
        I accept the terms and conditions
      </label>
      <span class="msg error">{{ firstError('terms') || '&nbsp;' }}</span>

      <div class="actions">
        <button type="submit">Validate</button>
        <button type="button" class="ghost" @click="reset">Reset</button>
      </div>
    </form>

    <div class="card output">
      <CodeSnippet :code="schemaCode" label="Schema" />
      <template v-if="submitted">
        <h4 v-if="validated">✓ Passed  validated()</h4>
        <JsonView v-if="validated" :data="validated" tone="ok" />
        <h4 v-else>✗ Failed  errors().messages()</h4>
        <JsonView v-if="!validated" :data="errors" tone="error" />
      </template>
      <p v-else class="hint">
        Submit the form to see <code>validated()</code> or <code>errors()</code>.
      </p>
    </div>
  </div>
</template>
