<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Validator } from '@anil-labs/validator'
import CodeSnippet from './CodeSnippet.vue'
import JsonView from './JsonView.vue'

interface Member {
  name: string
  email: string
}

const members = reactive<Member[]>([
  { name: 'Ada', email: 'ada@example.com' },
  { name: '', email: 'not-an-email' },
])

const errors = ref<Record<string, string[]>>({})
const passed = ref<boolean | null>(null)

const code = `Validator.make(
  { members },
  {
    'members.*.name':  'required',
    'members.*.email': 'required|email|distinct',
  },
  { 'members.*.email.required': 'Member #:position needs an email.' },
)`

function add(): void {
  members.push({ name: '', email: '' })
}

function remove(index: number): void {
  members.splice(index, 1)
}

function validateAll(): void {
  const v = Validator.make(
    { members },
    {
      'members.*.name': 'required',
      'members.*.email': 'required|email|distinct',
    },
    { 'members.*.email.required': 'Member #:position needs an email.' },
  )
  passed.value = v.passes()
  errors.value = v.errors().messages()
}

function rowError(index: number): string {
  return (
    errors.value[`members.${index}.email`]?.[0] ?? errors.value[`members.${index}.name`]?.[0] ?? ''
  )
}
</script>

<template>
  <div class="split">
    <div class="card">
      <div v-for="(m, i) in members" :key="i" class="member-row">
        <span class="row-index">{{ i + 1 }}</span>
        <input v-model="m.name" placeholder="Name" :class="{ invalid: rowError(i) !== '' }" />
        <input v-model="m.email" placeholder="Email" :class="{ invalid: rowError(i) !== '' }" />
        <button type="button" class="icon" title="Remove" @click="remove(i)">×</button>
        <span v-if="rowError(i)" class="msg error row-msg">{{ rowError(i) }}</span>
      </div>

      <div class="actions">
        <button type="button" class="ghost" @click="add">+ Add member</button>
        <button type="button" @click="validateAll">Validate all</button>
      </div>
    </div>

    <div class="card output">
      <CodeSnippet :code="code" label="Wildcard rules" />
      <template v-if="passed !== null">
        <h4 :class="passed ? 'ok' : 'error'">
          {{ passed ? '✓ All rows valid' : '✗ Some rows invalid' }}
        </h4>
        <JsonView :data="errors" :tone="passed ? 'ok' : 'error'" />
      </template>
      <p v-else class="hint">
        The <code>distinct</code> rule also rejects duplicate emails across rows.
      </p>
    </div>
  </div>
</template>
