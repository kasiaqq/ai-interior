<script setup lang="ts">
defineProps<{ items: { name: string; url: string }[]; aspectRatio: string }>()
defineEmits<{ clear: [] }>()
</script>

<template>
  <section class="card compare" aria-label="Comparison">
    <div class="compare__head">
      <p class="eyebrow">Comparing · {{ items.map((item) => item.name).join(' and ') }}</p>
      <button type="button" class="btn" @click="$emit('clear')">Clear selection</button>
    </div>
    <div class="compare__grid">
      <figure v-for="item in items" :key="item.url" class="compare__item">
        <img :src="item.url" :alt="item.name" class="compare__image" :style="{ aspectRatio }" />
        <figcaption>{{ item.name }}</figcaption>
      </figure>
    </div>
    <p class="compare__note">Same frame in both: walls, windows and doors sit in exactly the same place.</p>
  </section>
</template>

<style scoped>
.compare {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.compare__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.compare__grid {
  display: grid;
  gap: var(--space-3);
}

.compare__item {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.compare__image {
  width: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.compare__note {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (min-width: 640px) {
  .compare__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
