<script setup lang="ts">
defineProps<{
  id: string
  imageUrl: string
  name: string
  time: string
  downloadName: string
  compared: boolean
  compareDisabled: boolean
}>()
defineEmits<{ toggleCompare: [] }>()
</script>

<template>
  <article class="card result-card">
    <img :src="imageUrl" alt="" class="result-card__image" />
    <div class="result-card__body">
      <h3 class="result-card__name">{{ name }}</h3>
      <p class="result-card__time">{{ time }}</p>
      <div class="result-card__actions">
        <NuxtLink :to="`/result/${id}`" class="btn">Open</NuxtLink>
        <a :href="imageUrl" :download="downloadName" class="btn" :aria-label="`Download ${name}`">
          <AppIcon name="download" :size="14" />
        </a>
      </div>
      <label class="result-card__compare">
        <input
          type="checkbox"
          :checked="compared"
          :disabled="compareDisabled"
          @change="$emit('toggleCompare')"
        />
        Compare
      </label>
    </div>
  </article>
</template>

<style scoped>
.result-card {
  overflow: hidden;
}

.result-card__image {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
}

.result-card__body {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
}

.result-card__name {
  font-size: var(--text-sm);
  font-weight: 600;
}

.result-card__time {
  margin-top: calc(-1 * var(--space-2));
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.result-card__actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
}

.result-card__compare {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  cursor: pointer;
}

.result-card__compare input {
  accent-color: var(--color-accent);
}

.result-card__compare:has(:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
