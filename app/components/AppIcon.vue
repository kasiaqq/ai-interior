<script setup lang="ts">
const PATHS = {
  logo: 'M3 4h18v16H3z M3 15l5-5 4 4 3-3 6 6 M16 8.5a1.5 1.5 0 1 0 0 .01',
  check: 'M4 12.5l5 5 11-11',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 15v4h16v-4',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  alert: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8v5 M12 16v.01',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6 M20 4v5h-5',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  download: 'M12 4v12 M7 11l5 5 5-5 M4 20h16',
  handle: 'M10 8l-4 4 4 4 M14 8l4 4-4 4',
} as const

defineProps<{ name: keyof typeof PATHS; size?: number }>()
</script>

<template>
  <svg
    :width="size ?? 16"
    :height="size ?? 16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="PATHS[name]" />
  </svg>
</template>
