<script setup lang="ts">
defineProps<{ code: string; label?: string }>()
</script>

<template>
  <div class="snippet">
    <span v-if="label" class="snippet-label">{{ label }}</span>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
