<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Validator } from '@anil-labs/validator'
import type { ValidationData } from '@anil-labs/validator'
import CodeSnippet from './CodeSnippet.vue'
import JsonView from './JsonView.vue'

interface FormShape {
  title: string
  count: string
  email: string
  handle: string
}

const blank = (): FormShape => ({
  title: 'Launch plan',
  count: '3',
  email: 'ada@example.com',
  handle: 'ada',
})
const form = reactive<FormShape>(blank())

// A `const` rules literal  this is what lets `make` infer the output shape.
const schema = {
  title: 'required|string|max:255',
  count: 'required|integer|min:1',
  email: 'required|email',
  'profile.handle': 'required|string',
} as const

const code = `const data = Validator.make(input, {
  title: 'required|string|max:255',
  count: 'required|integer|min:1',
  email: 'required|email',
  'profile.handle': 'required|string',
}).validated()

// inferred  no \`as const\`, no interface:
// {
//   title: string
//   count: number
//   email: string
//   profile: { handle: string }
// }
data.count.toFixed(0)   // ✅ number
data.profile.handle     // ✅ nested string`

const summary = ref<string>('')
const output = ref<ValidationData | null>(null)
const errors = ref<Record<string, string[]>>({})
const submitted = ref(false)

function buildData(): ValidationData {
  return {
    title: form.title,
    // Coerce the form string at the edge so the runtime value matches the
    // inferred `number` (the engine validates but never coerces).
    count: form.count === '' ? form.count : Number(form.count),
    email: form.email,
    profile: { handle: form.handle },
  }
}

function run(): void {
  submitted.value = true
  const v = Validator.make(buildData(), schema)
  if (v.passes()) {
    const data = v.validated()
    // ── typed access  enforced by `npm run demo:typecheck` ──
    summary.value = `${data.title.toUpperCase()}  ${data.count.toFixed(0)} item(s) · @${data.profile.handle}`
    output.value = data
    errors.value = {}
  } else {
    summary.value = ''
    output.value = null
    errors.value = v.errors().messages()
  }
}

function reset(): void {
  Object.assign(form, blank())
  submitted.value = false
  summary.value = ''
  output.value = null
  errors.value = {}
}

function firstError(field: string): string {
  return errors.value[field]?.[0] ?? ''
}
</script>

<template>
  <div class="split">
    <form class="card form" novalidate @submit.prevent="run">
      <div class="field">
        <label for="ti-title" class="field-label">Title (string)</label>
        <input
          id="ti-title"
          v-model="form.title"
          type="text"
          :class="{ invalid: firstError('title') }"
        />
        <span class="msg error">{{ firstError('title') || '&nbsp;' }}</span>
      </div>
      <div class="field">
        <label for="ti-count" class="field-label">Count (integer)</label>
        <input
          id="ti-count"
          v-model="form.count"
          type="number"
          :class="{ invalid: firstError('count') }"
        />
        <span class="msg error">{{ firstError('count') || '&nbsp;' }}</span>
      </div>
      <div class="field">
        <label for="ti-email" class="field-label">Email</label>
        <input
          id="ti-email"
          v-model="form.email"
          type="email"
          :class="{ invalid: firstError('email') }"
        />
        <span class="msg error">{{ firstError('email') || '&nbsp;' }}</span>
      </div>
      <div class="field">
        <label for="ti-handle" class="field-label">profile.handle (nested string)</label>
        <input
          id="ti-handle"
          v-model="form.handle"
          type="text"
          :class="{ invalid: firstError('profile.handle') }"
        />
        <span class="msg error">{{ firstError('profile.handle') || '&nbsp;' }}</span>
      </div>

      <div class="actions">
        <button type="submit">Validate</button>
        <button type="button" class="ghost" @click="reset">Reset</button>
      </div>
    </form>

    <div class="card output">
      <CodeSnippet :code="code" label="Inferred type" />
      <template v-if="submitted">
        <template v-if="output">
          <h4>✓ Passed  typed validated()</h4>
          <p class="hint">{{ summary }}</p>
          <JsonView :data="output" tone="ok" />
        </template>
        <template v-else>
          <h4>✗ Failed  errors().messages()</h4>
          <JsonView :data="errors" tone="error" />
        </template>
      </template>
      <p v-else class="hint">Validate to see the typed <code>validated()</code> output.</p>
    </div>
  </div>
</template>
