<script setup lang="ts">
import type { StyleDefinition } from '#shared/catalog'
import type { StyleId } from '#shared/types'

defineProps<{ id: StyleId; definition: StyleDefinition }>()
const model = defineModel<StyleId | null>({ required: true })
</script>

<template>
  <label class="card style-card" :class="{ 'style-card--selected': model === id }">
    <input v-model="model" type="radio" name="style" :value="id" class="visually-hidden" />
    <span v-if="model === id" class="style-card__check"><AppIcon name="check" :size="12" /></span>
    <StyleIllustration :swatches="definition.swatches" />
    <span class="style-card__body">
      <span class="style-card__name">{{ definition.label }}</span>
      <span class="style-card__description">{{ definition.description }}</span>
      <span class="style-card__swatches">
        <span v-for="colour in definition.swatches" :key="colour" class="swatch" :style="{ background: colour }" />
      </span>
    </span>
  </label>
</template>

<style scoped>
.style-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
}

.style-card:hover {
  border-color: var(--color-border-strong);
}

.style-card:has(:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.style-card--selected {
  border-color: var(--color-accent);
}

.style-card__check {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.style-card__body {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
}

.style-card__name {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  line-height: 1.1;
}

.style-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.style-card__swatches {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.swatch {
  width: 16px;
  height: 16px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: var(--radius-sm);
}
</style>
