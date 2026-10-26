<script setup lang="ts">
/** Flat room sketch in the style's colours, as drawn on the style screen. */
const props = defineProps<{ swatches: string[] }>()
const [wall, floor, accent, ink] = props.swatches
</script>

<template>
  <svg viewBox="0 0 240 180" class="illustration" aria-hidden="true">
    <rect width="240" height="128" :fill="wall" />
    <rect y="128" width="240" height="52" :fill="floor" />
    <rect x="16" y="36" width="26" height="92" :fill="wall" :stroke="ink" stroke-opacity="0.25" />
    <rect x="146" y="28" width="62" height="60" fill="#f6f4ef" :stroke="ink" stroke-opacity="0.35" stroke-width="2" />
    <rect x="48" y="92" width="76" height="36" rx="3" :fill="accent" />
    <rect x="54" y="140" width="128" height="30" rx="2" fill="#efe9de" opacity="0.8" />
  </svg>
</template>

<style scoped>
.illustration {
  display: block;
  width: 100%;
  height: auto;
}
</style>
