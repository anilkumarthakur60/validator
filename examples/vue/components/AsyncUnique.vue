<script setup lang="ts">
import { ref, watch } from 'vue'
import { Validator } from '@/lib/core/Validator'
import type { DatabaseQuery } from '@/lib/types'
import CodeSnippet from './CodeSnippet.vue'

const TAKEN = new Set(['taken@example.com', 'admin@example.com', 'hello@example.com'])

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const email = ref('taken@example.com')
const status = ref<Status>('idle')
const message = ref('')

const code = `Validator.make(
  { email },
  { email: 'required|email|unique:users' },
).withResolvers({
  // returns true when the value is free
  unique: (q) => api.isEmailFree(q.value),
})

await v.failsAsync() // resolvers require the async path`

// Simulates a network round-trip to a "users" table.
function lookup(query: DatabaseQuery): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(!TAKEN.has(String(query.value)))
    }, 450)
  })
}

let token = 0
async function check(value: string): Promise<void> {
  const mine = ++token
  status.value = 'checking'
  message.value = 'Checking availability…'

  const v = Validator.make(
    { email: value },
    { email: 'required|email|unique:users' },
  ).withResolvers({ unique: lookup })

  const failed = await v.failsAsync()
  if (mine !== token) return // a newer keystroke superseded this check

  if (!failed) {
    status.value = 'available'
    message.value = '✓ Email is available'
    return
  }
  const first = v.errors().first('email')
  status.value = first.includes('taken') ? 'taken' : 'invalid'
  message.value = first
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(
  email,
  (value) => {
    clearTimeout(timer)
    if (value.trim() === '') {
      token++
      status.value = 'idle'
      message.value = ''
      return
    }
    timer = setTimeout(() => void check(value), 350)
  },
  { immediate: true },
)
</script>

<template>
  <div class="split">
    <div class="card">
      <p class="hint">
        Already taken:
        <code>taken@example.com</code>, <code>admin@example.com</code>,
        <code>hello@example.com</code>
      </p>
      <label class="field">
        <span class="field-label">Email</span>
        <div class="async-input">
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            :class="{
              valid: status === 'available',
              invalid: status === 'taken' || status === 'invalid',
            }"
          />
          <span v-if="status === 'checking'" class="spinner" />
        </div>
        <span
          class="msg"
          :class="{
            ok: status === 'available',
            error: status === 'taken' || status === 'invalid',
          }"
          >{{ message || '&nbsp;' }}</span
        >
      </label>
      <p class="hint">Validation is debounced (350ms) and stale responses are discarded.</p>
    </div>

    <div class="card output">
      <CodeSnippet :code="code" label="Async resolver" />
    </div>
  </div>
</template>
