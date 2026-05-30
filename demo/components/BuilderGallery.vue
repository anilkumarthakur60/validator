<script setup lang="ts">
import { reactive } from 'vue'
import { validation } from '@/lib/fluent/builder'
import type { FieldRuleFn } from '@/lib/types'

interface Demo {
  label: string
  code: string
  rule: FieldRuleFn
  sample: string
}

interface Group {
  title: string
  items: Demo[]
}

const groups: Group[] = [
  {
    title: 'Strings',
    items: [
      {
        label: 'alpha',
        code: `validation.alpha()`,
        rule: validation.alpha().toRule(),
        sample: 'Hello',
      },
      {
        label: 'alphaDash',
        code: `validation.alphaDash()`,
        rule: validation.alphaDash().toRule(),
        sample: 'a_b-1',
      },
      {
        label: 'uuid',
        code: `validation.uuid()`,
        rule: validation.uuid().toRule(),
        sample: crypto.randomUUID(),
      },
      {
        label: 'hexColor',
        code: `validation.hexColor()`,
        rule: validation.hexColor().toRule(),
        sample: '#3b82f6',
      },
      {
        label: 'startsWith',
        code: `validation.startsWith('SK-')`,
        rule: validation.startsWith('SK-').toRule(),
        sample: 'SK-001',
      },
      {
        label: 'uppercase',
        code: `validation.uppercase()`,
        rule: validation.uppercase().toRule(),
        sample: 'HELLO',
      },
    ],
  },
  {
    title: 'Numbers',
    items: [
      {
        label: 'integer + between',
        code: `validation.integer().between(1, 10)`,
        rule: validation.integer().between(1, 10).toRule(),
        sample: '7',
      },
      {
        label: 'decimal',
        code: `validation.decimal(2)`,
        rule: validation.decimal(2).toRule(),
        sample: '19.99',
      },
      {
        label: 'multipleOf',
        code: `validation.multipleOf(5)`,
        rule: validation.multipleOf(5).toRule(),
        sample: '25',
      },
      {
        label: 'digits',
        code: `validation.digits(4)`,
        rule: validation.digits(4).toRule(),
        sample: '2024',
      },
    ],
  },
  {
    title: 'Dates',
    items: [
      {
        label: 'date',
        code: `validation.date()`,
        rule: validation.date().toRule(),
        sample: '2026-05-30',
      },
      {
        label: 'after',
        code: `validation.after('2020-01-01')`,
        rule: validation.after('2020-01-01').toRule(),
        sample: '2026-05-30',
      },
      {
        label: 'dateFormat',
        code: `validation.dateFormat('Y-m-d')`,
        rule: validation.dateFormat('Y-m-d').toRule(),
        sample: '2026-05-30',
      },
    ],
  },
  {
    title: 'Network & format',
    items: [
      {
        label: 'ip',
        code: `validation.ip()`,
        rule: validation.ip().toRule(),
        sample: '192.168.0.1',
      },
      {
        label: 'macAddress',
        code: `validation.macAddress()`,
        rule: validation.macAddress().toRule(),
        sample: '3D:F2:C9:A6:B3:4F',
      },
      {
        label: 'json',
        code: `validation.json()`,
        rule: validation.json().toRule(),
        sample: '{"a":1}',
      },
      {
        label: 'in',
        code: `validation.in('sm', 'md', 'lg')`,
        rule: validation.in('sm', 'md', 'lg').toRule(),
        sample: 'md',
      },
    ],
  },
]

// Seed each demo with its sample value so every card starts in a valid state.
const values = reactive<Record<string, string>>({})
for (const group of groups) {
  for (const item of group.items) {
    values[item.label] = item.sample
  }
}

function resultFor(item: Demo): true | string {
  return item.rule(values[item.label] ?? '')
}
</script>

<template>
  <div class="gallery">
    <section v-for="group in groups" :key="group.title" class="gallery-group">
      <h3>{{ group.title }}</h3>
      <div class="card-grid tight">
        <article v-for="item in group.items" :key="item.label" class="card mini">
          <code class="mini-code">{{ item.code }}</code>
          <input
            v-model="values[item.label]"
            :class="{
              valid: resultFor(item) === true,
              invalid: resultFor(item) !== true,
            }"
          />
          <span class="msg" :class="resultFor(item) === true ? 'ok' : 'error'">
            <template v-if="resultFor(item) === true">✓ valid</template>
            <template v-else>{{ resultFor(item) }}</template>
          </span>
        </article>
      </div>
    </section>
  </div>
</template>
