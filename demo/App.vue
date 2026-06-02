<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LiveFields from './components/LiveFields.vue'
import RegistrationForm from './components/RegistrationForm.vue'
import TypeInference from './components/TypeInference.vue'
import NestedArray from './components/NestedArray.vue'
import AsyncUnique from './components/AsyncUnique.vue'
import BuilderGallery from './components/BuilderGallery.vue'
import RulePlayground from './components/RulePlayground.vue'

interface Section {
  id: string
  index: string
  title: string
  blurb: string
  component: typeof LiveFields
}

const sections: Section[] = [
  {
    id: 'live',
    index: '01',
    title: 'Fluent builder',
    blurb: 'Chainable, Quasar-style :rules — validates as you type.',
    component: LiveFields,
  },
  {
    id: 'register',
    index: '02',
    title: 'Registration form',
    blurb: 'Validator.make() over a whole dataset, with cross-field rules.',
    component: RegistrationForm,
  },
  {
    id: 'infer',
    index: '03',
    title: 'Type inference',
    blurb: 'validated() typed straight from the rule strings — no as const.',
    component: TypeInference,
  },
  {
    id: 'nested',
    index: '04',
    title: 'Nested arrays',
    blurb: 'Wildcard rules (members.*.email) on dynamic rows.',
    component: NestedArray,
  },
  {
    id: 'async',
    index: '05',
    title: 'Async rules',
    blurb: 'Resolver-backed unique check with debounced, awaited validation.',
    component: AsyncUnique,
  },
  {
    id: 'gallery',
    index: '06',
    title: 'Rule gallery',
    blurb: 'A live cheat-sheet across strings, numbers, dates, and more.',
    component: BuilderGallery,
  },
  {
    id: 'playground',
    index: '07',
    title: 'Playground',
    blurb: 'Try a single rule or a whole-dataset schema — browse every built-in rule.',
    component: RulePlayground,
  },
]

const activeId = ref<string>(sections[0]?.id ?? 'live')
const active = computed<Section>(
  () => sections.find((s) => s.id === activeId.value) ?? sections[0]!,
)

// ── mobile sheet ─────────────────────────────────────────
const sheetOpen = ref(false)

function select(id: string): void {
  activeId.value = id
  sheetOpen.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') sheetOpen.value = false
}

// Lock background scroll while the sheet is open (shadcn behaviour).
watch(sheetOpen, (open) => {
  document.body.classList.toggle('sheet-locked', open)
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('sheet-locked')
})
</script>

<template>
  <div class="layout" :class="{ 'sheet-open': sheetOpen }">
    <!-- Mobile top bar -->
    <header class="topbar">
      <button
        class="menu-btn"
        type="button"
        aria-label="Open navigation"
        :aria-expanded="sheetOpen"
        @click="sheetOpen = true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-width="2" stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="topbar-brand">
        <span class="brand-mark sm">✓</span>
        <strong>@anil-labs/validator</strong>
      </div>
    </header>

    <!-- Sheet overlay (backdrop) -->
    <div
      class="overlay"
      :class="{ show: sheetOpen }"
      aria-hidden="true"
      @click="sheetOpen = false"
    />

    <!-- Sidebar / mobile sheet -->
    <aside class="sidebar" :class="{ open: sheetOpen }" role="navigation">
      <div class="sidebar-head">
        <div class="brand">
          <div class="brand-mark">✓</div>
          <div>
            <h1>@anil-labs/validator</h1>
            <p>Expressive validation for TypeScript</p>
          </div>
        </div>
        <button
          class="sheet-close"
          type="button"
          aria-label="Close navigation"
          @click="sheetOpen = false"
        >
          ×
        </button>
      </div>

      <nav>
        <button
          v-for="s in sections"
          :key="s.id"
          class="nav-item"
          :class="{ active: s.id === activeId }"
          type="button"
          @click="select(s.id)"
        >
          <span class="nav-index">{{ s.index }}</span>
          <span class="nav-text">
            <span class="nav-title">{{ s.title }}</span>
            <span class="nav-blurb">{{ s.blurb }}</span>
          </span>
        </button>
      </nav>

      <footer class="sidebar-foot">
        <span class="dot" /> Vue 3 · strict TypeScript · zero-dependency core
      </footer>
    </aside>

    <main class="content">
      <header class="content-head">
        <span class="kicker">{{ active.index }} — Demo</span>
        <h2>{{ active.title }}</h2>
        <p>{{ active.blurb }}</p>
      </header>
      <KeepAlive>
        <component :is="active.component" :key="active.id" />
      </KeepAlive>
    </main>
  </div>
</template>
