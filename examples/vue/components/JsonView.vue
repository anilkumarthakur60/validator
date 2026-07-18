<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ data: unknown; tone?: 'ok' | 'error' | 'plain' }>()

const pretty = computed(() => JSON.stringify(props.data, null, 2))
</script>

<template>
  <pre class="json" :class="`json-${tone ?? 'plain'}`"><code>{{ pretty }}</code></pre>
</template>
