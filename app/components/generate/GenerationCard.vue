<script setup lang="ts">
import type { Progress } from '~/composables/useGeneration'

const props = defineProps<{ photoUrl: string; styleLabel: string; progress: Progress }>()
const emit = defineEmits<{ cancel: [] }>()

const STAGES = ['Reading the room', 'Placing furniture', 'Lighting and finish']
const STAGE_DETAIL = ['Reading the room', 'Placing furniture and lighting', 'Adding the lighting and finish']

const status = computed(() =>
  props.progress.secondsLeft > 0
    ? `${STAGE_DETAIL[props.progress.stage]} — about ${props.progress.secondsLeft} seconds left`
    : 'Almost there…',
)
</script>

<template>
  <section class="card generating" aria-live="polite">
    <img :src="photoUrl" alt="" class="generating__photo" />
    <h1 class="title generating__title">Restyling your room in {{ styleLabel }}</h1>
    <p class="generating__status">{{ status }}</p>

    <div
      class="bar"
      role="progressbar"
      aria-label="Restyling progress"
      :aria-valuenow="Math.round(progress.ratio * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span class="bar__fill" :style="{ transform: `scaleX(${progress.ratio})` }" />
    </div>
    <ol class="stages">
      <li v-for="(stage, index) in STAGES" :key="stage" :class="{ 'stages__current': index === progress.stage }">
        {{ stage }}
      </li>
    </ol>

    <p class="note generating__note">
      <AppIcon name="lock" :size="14" />
      Your walls, windows and doors stay exactly where they are. Everything else is open.
    </p>
    <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
  </section>
</template>

<style scoped>
.generating {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  max-width: 630px;
  margin-inline: auto;
  padding: var(--space-8) var(--space-6);
  text-align: center;
}

.generating__photo {
  width: min(290px, 100%);
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: var(--radius-sm);
  filter: grayscale(0.6) brightness(0.55);
}

.generating__title {
  margin-top: var(--space-4);
  font-size: 2rem;
}

.generating__status {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.bar {
  width: 100%;
  height: 4px;
  margin-top: var(--space-3);
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
}

.bar__fill {
  display: block;
  height: 100%;
  background: var(--color-accent);
  transform-origin: left;
  transition: transform 0.25s linear;
}

.stages {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  list-style: none;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.stages__current {
  color: var(--color-text);
  font-weight: 600;
}

.generating__note {
  width: 100%;
  margin-block: var(--space-3);
  text-align: left;
}
</style>
