<script setup lang="ts">
import { computed, ref } from 'vue'
import { Validator } from '@/lib/core/Validator'
import JsonView from './JsonView.vue'

const rulesInput = ref('required|string|min:3|max:10')
const valueInput = ref('"hi"')

const presets = [
  { label: 'string length', rules: 'required|string|min:3|max:10', value: '"hi"' },
  { label: 'integer range', rules: 'required|integer|between:18,120', value: '15' },
  { label: 'email', rules: 'required|email', value: '"not-an-email"' },
  { label: 'in list', rules: 'required|in:sm,md,lg', value: '"xl"' },
  { label: 'array distinct', rules: 'array|distinct', value: '[1, 2, 2]' },
  { label: 'url', rules: 'required|url:https', value: '"http://x.com"' },
] as const

interface Outcome {
  ok: boolean
  errors: string[]
  parsedValue: unknown
  error?: string
}

const outcome = computed<Outcome>(() => {
  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(valueInput.value)
  } catch {
    parsedValue = valueInput.value // fall back to the raw string
  }
  try {
    const v = Validator.make({ field: parsedValue }, { field: rulesInput.value })
    const ok = v.passes()
    return { ok, errors: v.errors().get('field'), parsedValue }
  } catch (error) {
    return {
      ok: false,
      errors: [],
      parsedValue,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

function applyPreset(preset: (typeof presets)[number]): void {
  rulesInput.value = preset.rules
  valueInput.value = preset.value
}
</script>

<template>
  <div class="card playground">
    <div class="preset-row">
      <span class="field-label">Presets</span>
      <button
        v-for="p in presets"
        :key="p.label"
        type="button"
        class="chip"
        @click="applyPreset(p)"
      >
        {{ p.label }}
      </button>
    </div>

    <div class="field">
      <label for="pg-rules" class="field-label">Rules — pipe syntax</label>
      <input id="pg-rules" v-model="rulesInput" spellcheck="false" />
    </div>

    <div class="field">
      <label for="pg-value" class="field-label">
        Value — JSON (e.g. <code>"hi"</code>, <code>42</code>, <code>[1,2]</code>,
        <code>{"a":1}</code>)
      </label>
      <input id="pg-value" v-model="valueInput" spellcheck="false" />
    </div>

    <div class="result-banner" :class="outcome.error ? 'error' : outcome.ok ? 'ok' : 'fail'">
      <template v-if="outcome.error">⚠ {{ outcome.error }}</template>
      <template v-else-if="outcome.ok">✓ passes</template>
      <template v-else>✗ fails</template>
    </div>

    <JsonView
      v-if="!outcome.error"
      :data="{ value: outcome.parsedValue, passes: outcome.ok, errors: outcome.errors }"
      :tone="outcome.ok ? 'ok' : 'error'"
    />
  </div>
</template>
