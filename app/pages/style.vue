<script setup lang="ts">
import { ROOM_TYPES, STYLES } from '#shared/catalog'
import type { StyleId } from '#shared/types'
import { ESTIMATED_SECONDS } from '~/composables/useGeneration'
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const generation = useGeneration()
const style = ref<StyleId | null>(session.style)
const styles = Object.entries(STYLES) as [StyleId, (typeof STYLES)[StyleId]][]

const roomName = computed(() => (session.roomType === 'other' ? 'room' : ROOM_TYPES[session.roomType!].label.toLowerCase()))

function generate() {
  if (!style.value) return
  session.setStyle(style.value)
  generation.start()
  navigateTo('/generate')
}
</script>

<template>
  <div class="container">
    <div class="intro">
      <div>
        <h1 class="title">Pick a style for your {{ roomName }}</h1>
        <p class="lead intro__lead">
          One at a time. You can run the same photo in another style afterwards, without uploading it again.
        </p>
      </div>
      <span class="badge">As the style looks in 2026</span>
    </div>

    <fieldset class="styles">
      <legend class="visually-hidden">Style</legend>
      <StyleCard v-for="[id, definition] in styles" :id="id" :key="id" v-model="style" :definition="definition" />
    </fieldset>

    <StepFooter
      back-to="/room"
      :hint="`Takes about ${ESTIMATED_SECONDS} seconds. Up to 10 generations every 10 minutes.`"
      :primary-label="style ? `Generate ${STYLES[style].label}` : 'Pick a style'"
      :primary-disabled="!style"
      @primary="generate"
    />
  </div>
</template>

<style scoped>
.intro {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.intro__lead {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
}

.badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
  font-size: var(--text-xs);
  font-weight: 600;
}

.styles {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  border: 0;
}

@media (min-width: 640px) {
  .styles {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .styles {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
