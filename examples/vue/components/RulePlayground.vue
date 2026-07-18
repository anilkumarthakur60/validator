<script setup lang="ts">
import { computed, ref } from 'vue'
import { Validator } from '@anil-labs/validator'
import type { RulesSchema, ValidationData } from '@anil-labs/validator'
import { rules } from '@anil-labs/validator'
const {
  arrayRules,
  booleanRules,
  dateRules,
  fileRules,
  numberRules,
  presenceRules,
  sizeRules,
  stringRules,
  utilityRules,
} = rules
import JsonView from './JsonView.vue'

type Mode = 'single' | 'dataset'
const mode = ref<Mode>('single')

// ── catalog of every built-in rule, grouped ──────────────
const catalog: { title: string; names: string[] }[] = [
  { title: 'Presence', names: Object.keys(presenceRules) },
  { title: 'Strings', names: Object.keys(stringRules) },
  { title: 'Numbers', names: Object.keys(numberRules) },
  { title: 'Size', names: Object.keys(sizeRules) },
  { title: 'Dates', names: Object.keys(dateRules) },
  { title: 'Booleans', names: Object.keys(booleanRules) },
  { title: 'Arrays', names: Object.keys(arrayRules) },
  { title: 'Files', names: Object.keys(fileRules) },
  { title: 'Utility', names: Object.keys(utilityRules) },
].map((g) => ({ title: g.title, names: [...g.names].sort() }))

const ruleCount = catalog.reduce((sum, g) => sum + g.names.length, 0)

// ── single-field mode ────────────────────────────────────
const rulesInput = ref('required|string|min:3|max:10')
const valueInput = ref('"hi"')

const singlePresets = [
  { label: 'string length', rules: 'required|string|min:3|max:10', value: '"hi"' },
  { label: 'integer range', rules: 'required|integer|between:18,120', value: '15' },
  { label: 'email', rules: 'required|email', value: '"not-an-email"' },
  { label: 'in list', rules: 'required|in:sm,md,lg', value: '"xl"' },
  { label: 'array distinct', rules: 'array|distinct', value: '[1, 2, 2]' },
  { label: 'url (https)', rules: 'required|url:https', value: '"http://x.com"' },
] as const

interface SingleOutcome {
  ok: boolean
  errors: string[]
  parsedValue: unknown
  error?: string
}

const singleOutcome = computed<SingleOutcome>(() => {
  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(valueInput.value)
  } catch {
    parsedValue = valueInput.value // fall back to the raw string
  }
  try {
    const v = Validator.make({ field: parsedValue }, { field: rulesInput.value })
    return { ok: v.passes(), errors: v.errors().get('field'), parsedValue }
  } catch (error) {
    return {
      ok: false,
      errors: [],
      parsedValue,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

function applySinglePreset(p: (typeof singlePresets)[number]): void {
  rulesInput.value = p.rules
  valueInput.value = p.value
}

function insertRule(name: string): void {
  mode.value = 'single'
  const current = rulesInput.value.trim()
  rulesInput.value = current === '' ? name : `${current}|${name}`
}

// ── dataset mode ─────────────────────────────────────────
const datasetPresets = [
  {
    label: 'Signup (valid)',
    data: `{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "age": 30,
  "password": "s3cret pass",
  "password_confirmation": "s3cret pass",
  "tags": ["vue", "ts"]
}`,
    schema: `{
  "name": "required|string|max:255",
  "email": "required|email",
  "age": "required|integer|between:18,120",
  "password": "required|min:8|confirmed",
  "tags": "array|distinct"
}`,
  },
  {
    label: 'Signup (errors)',
    data: `{
  "name": "",
  "email": "nope",
  "age": 15,
  "password": "short",
  "password_confirmation": "different",
  "tags": ["a", "a"]
}`,
    schema: `{
  "name": "required|string|max:255",
  "email": "required|email",
  "age": "required|integer|between:18,120",
  "password": "required|min:8|confirmed",
  "tags": "array|distinct"
}`,
  },
  {
    label: 'Nested array',
    data: `{
  "members": [
    { "name": "Ada", "email": "ada@example.com" },
    { "name": "", "email": "oops" }
  ]
}`,
    schema: `{
  "members.*.name": "required",
  "members.*.email": "required|email"
}`,
  },
  {
    label: 'Conditional',
    data: `{ "payment_type": "cc", "cc_number": "" }`,
    schema: `{ "cc_number": "required_if:payment_type,cc|digits:16" }`,
  },
] as const

const dataInput = ref<string>(datasetPresets[0].data)
const schemaInput = ref<string>(datasetPresets[0].schema)

interface DatasetOutcome {
  ok: boolean
  errors: Record<string, string[]>
  validated: ValidationData
  parseError?: string
}

const datasetOutcome = computed<DatasetOutcome>(() => {
  let data: ValidationData
  let schema: RulesSchema
  try {
    data = JSON.parse(dataInput.value) as ValidationData
  } catch {
    return { ok: false, errors: {}, validated: {}, parseError: 'Data is not valid JSON.' }
  }
  try {
    schema = JSON.parse(schemaInput.value) as RulesSchema
  } catch {
    return { ok: false, errors: {}, validated: {}, parseError: 'Schema is not valid JSON.' }
  }
  try {
    const v = Validator.make(data, schema)
    const ok = v.passes()
    return { ok, errors: v.errors().messages(), validated: ok ? v.validated() : {} }
  } catch (error) {
    return {
      ok: false,
      errors: {},
      validated: {},
      parseError: error instanceof Error ? error.message : String(error),
    }
  }
})

function applyDatasetPreset(p: (typeof datasetPresets)[number]): void {
  dataInput.value = p.data
  schemaInput.value = p.schema
}
</script>

<template>
  <div class="playground">
    <!-- mode switch -->
    <div class="pg-tabs">
      <button
        type="button"
        class="pg-tab"
        :class="{ active: mode === 'single' }"
        @click="mode = 'single'"
      >
        Single field
      </button>
      <button
        type="button"
        class="pg-tab"
        :class="{ active: mode === 'dataset' }"
        @click="mode = 'dataset'"
      >
        Full dataset
      </button>
    </div>

    <!-- ── single field ── -->
    <div v-if="mode === 'single'" class="card">
      <div class="preset-row">
        <span class="field-label">Presets</span>
        <button
          v-for="p in singlePresets"
          :key="p.label"
          type="button"
          class="chip"
          @click="applySinglePreset(p)"
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

      <div
        class="result-banner"
        :class="singleOutcome.error ? 'error' : singleOutcome.ok ? 'ok' : 'fail'"
      >
        <template v-if="singleOutcome.error">⚠ {{ singleOutcome.error }}</template>
        <template v-else-if="singleOutcome.ok">✓ passes</template>
        <template v-else>✗ fails</template>
      </div>

      <JsonView
        v-if="!singleOutcome.error"
        :data="{
          value: singleOutcome.parsedValue,
          passes: singleOutcome.ok,
          errors: singleOutcome.errors,
        }"
        :tone="singleOutcome.ok ? 'ok' : 'error'"
      />
    </div>

    <!-- ── full dataset ── -->
    <div v-else class="card">
      <div class="preset-row">
        <span class="field-label">Presets</span>
        <button
          v-for="p in datasetPresets"
          :key="p.label"
          type="button"
          class="chip"
          @click="applyDatasetPreset(p)"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="pg-grid">
        <div class="field">
          <label for="pg-data" class="field-label">Data — JSON object</label>
          <textarea id="pg-data" v-model="dataInput" spellcheck="false" rows="9" />
        </div>
        <div class="field">
          <label for="pg-schema" class="field-label">Schema — field → rules</label>
          <textarea id="pg-schema" v-model="schemaInput" spellcheck="false" rows="9" />
        </div>
      </div>

      <div
        class="result-banner"
        :class="datasetOutcome.parseError ? 'error' : datasetOutcome.ok ? 'ok' : 'fail'"
      >
        <template v-if="datasetOutcome.parseError">⚠ {{ datasetOutcome.parseError }}</template>
        <template v-else-if="datasetOutcome.ok">✓ passes — validated() below</template>
        <template v-else>✗ fails — errors() below</template>
      </div>

      <template v-if="!datasetOutcome.parseError">
        <template v-if="datasetOutcome.ok">
          <h4 class="ok">validated()</h4>
          <JsonView :data="datasetOutcome.validated" tone="ok" />
        </template>
        <template v-else>
          <h4 class="error">errors().messages()</h4>
          <JsonView :data="datasetOutcome.errors" tone="error" />
        </template>
      </template>
    </div>

    <!-- ── rule catalog ── -->
    <details class="catalog">
      <summary>
        Rule catalog
        <span class="count">{{ ruleCount }} built-in rules — click to insert</span>
      </summary>
      <div class="cat-body">
        <section v-for="group in catalog" :key="group.title" class="cat-group">
          <h5>{{ group.title }}</h5>
          <div class="cat-chips">
            <button
              v-for="name in group.names"
              :key="name"
              type="button"
              class="rule-chip"
              @click="insertRule(name)"
            >
              {{ name }}
            </button>
          </div>
        </section>
      </div>
    </details>
  </div>
</template>
