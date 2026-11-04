<script setup lang="ts">
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const route = useRoute()

const onResult = computed(() => route.path.startsWith('/result/'))
const onResults = computed(() => route.path === '/results')
const lastResult = computed(() => session.results.at(-1))

const confirmingStartOver = ref(false)
function startOver() {
  if (session.results.length) confirmingStartOver.value = true
  else restart()
}
function restart() {
  confirmingStartOver.value = false
  session.reset()
  navigateTo('/')
}
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <NuxtLink to="/" class="logo">
        <AppIcon name="logo" :size="20" />
        AI Interior
      </NuxtLink>

      <div v-if="onResult || onResults" class="header__actions">
        <NuxtLink v-if="onResult" to="/results" class="header__link">
          <span class="wide-only">All results in this session ({{ session.results.length }})</span>
          <span class="narrow-only">Results ({{ session.results.length }})</span>
        </NuxtLink>
        <NuxtLink v-else-if="lastResult" :to="`/result/${lastResult.id}`" class="header__link">
          Back to the last result
        </NuxtLink>
        <button type="button" class="btn header__start-over" @click="startOver">Start over</button>
      </div>
      <Stepper v-else />
    </div>
  </header>

  <ConfirmDialog
    :open="confirmingStartOver"
    title="Start over?"
    body="This clears your photo and every result in this session. Download what you want to keep first."
    confirm-label="Start over"
    @confirm="restart"
    @cancel="confirmingStartOver = false"
  />
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--header-height);
  padding-inline: var(--gutter);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-serif);
  font-size: 1.25rem;
  text-decoration: none;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header__link {
  color: var(--color-accent-text);
  font-size: var(--text-sm);
  text-decoration: none;
}

.wide-only {
  display: none;
}

.header__start-over {
  min-height: 32px;
  padding: 0 var(--space-3);
}

@media (min-width: 768px) {
  .wide-only {
    display: inline-flex;
  }

  .header__start-over {
    min-height: 40px;
    padding: 0 var(--space-4);
  }

  .narrow-only {
    display: none;
  }
}
</style>
