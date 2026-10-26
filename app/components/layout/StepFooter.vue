<script setup lang="ts">
defineProps<{ backTo?: string; hint?: string; primaryLabel: string; primaryDisabled?: boolean }>()
const emit = defineEmits<{ primary: [] }>()
</script>

<template>
  <div class="footer-space" />
  <footer class="footer">
    <div class="container footer__inner">
      <NuxtLink v-if="backTo" :to="backTo" class="btn btn--ghost">Back</NuxtLink>
      <span v-else />
      <div class="footer__end">
        <p v-if="hint" class="footer__hint">{{ hint }}</p>
        <button type="button" class="btn btn--primary" :disabled="primaryDisabled" @click="emit('primary')">
          {{ primaryLabel }}
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-space {
  height: calc(var(--footer-height) + var(--space-8));
}

.footer {
  position: fixed;
  inset: auto 0 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--footer-height);
}

.footer__end {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.footer__hint {
  display: none;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .footer__hint {
    display: block;
  }
}
</style>
