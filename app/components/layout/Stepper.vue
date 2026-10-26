<script setup lang="ts">
import { ROOM_TYPES, STYLES } from '#shared/catalog'
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const route = useRoute()

const STEP_BY_PATH: Record<string, number> = { '/': 1, '/room': 2, '/style': 3, '/generate': 4 }
const current = computed(() => STEP_BY_PATH[route.path] ?? 4)

const steps = computed(() => [
  { number: 1, label: 'Photo' },
  { number: 2, label: current.value > 2 && session.roomType ? ROOM_TYPES[session.roomType].label : 'Room' },
  { number: 3, label: current.value > 3 && session.style ? STYLES[session.style].label : 'Style' },
  { number: 4, label: 'Result' },
])
</script>

<template>
  <nav aria-label="Progress">
    <ol class="stepper">
      <li
        v-for="step in steps"
        :key="step.number"
        class="step"
        :class="{ 'step--current': step.number === current, 'step--done': step.number < current }"
        :aria-current="step.number === current ? 'step' : undefined"
      >
        <span class="step__number">
          <AppIcon v-if="step.number === 1 && current > 1" name="check" :size="12" />
          <template v-else>{{ step.number }}</template>
        </span>
        <span class="step__label">{{ step.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
  font-size: var(--text-xs);
}

.step {
  display: none;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-subtle);
}


.step--done {
  color: var(--color-accent-text);
}

.step--current {
  display: flex;
  padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
  font-weight: 600;
}

.step__number {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
}

.step--current .step__number {
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

@media (min-width: 768px) {
  .step {
    display: flex;
  }

  .step + .step::before {
    content: '';
    width: 16px;
    height: 1px;
    margin-right: var(--space-2);
    background: var(--color-border-strong);
  }
}
</style>
