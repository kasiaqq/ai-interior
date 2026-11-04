<script setup lang="ts">
import { ROOM_TYPES } from '#shared/catalog'
import type { RoomTypeId } from '#shared/types'

const model = defineModel<RoomTypeId | null>({ required: true })
const options = Object.entries(ROOM_TYPES) as [RoomTypeId, { label: string }][]
</script>

<template>
  <fieldset class="grid">
    <legend class="visually-hidden">Room type</legend>
    <label v-for="[id, room] in options" :key="id" class="option" :class="{ 'option--selected': model === id }">
      <input v-model="model" type="radio" name="room-type" :value="id" class="visually-hidden" />
      {{ room.label }}
    </label>
  </fieldset>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.option {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  cursor: pointer;
}

.option:hover {
  border-color: var(--color-border-strong);
}

.option:has(:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.option--selected {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  font-weight: 600;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
