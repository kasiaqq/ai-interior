<script setup lang="ts">
import { STYLES } from '#shared/catalog'
import { errorMessage } from '#shared/errors'
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const generation = useGeneration()
const state = generation.state
const lastResult = computed(() => session.results.at(-1))

const router = useRouter()

watch(
  () => state.value,
  (current, previous) => {
    if (current.status === 'done') navigateTo(`/result/${current.resultId}`, { replace: true })
    // Landing here with nothing running (e.g. via the Forward button) has nothing to show.
    const nothingRunning = current.status === 'idle' || current.status === 'cancelled'
    if (!previous && nothingRunning) navigateTo('/style', { replace: true })
  },
  { immediate: true },
)

/** Back to wherever the run was started from — the style step or a result — without a duplicate history entry. */
function cancel() {
  generation.cancel()
  router.back()
}

// Nothing generates in the background: leaving this screen ends the run.
onBeforeRouteLeave((to) => {
  if (!to.path.startsWith('/result/')) generation.cancel()
})
</script>

<template>
  <div class="container generate">
    <GenerationCard
      v-if="state.status === 'running' && session.photo && session.style"
      :photo-url="session.photo.url"
      :style-label="STYLES[session.style].label"
      :progress="generation.progress.value"
      @cancel="cancel"
    />

    <section v-else-if="state.status === 'failed'" class="card failed" role="alert">
      <h1 class="title failed__title">That didn’t work</h1>
      <p class="lead">{{ errorMessage(state.code) }}</p>
      <div class="failed__actions">
        <button v-if="state.code !== 'QUOTA_REACHED'" type="button" class="btn btn--primary" @click="generation.retry()">
          Try again
        </button>
        <NuxtLink v-if="lastResult" :to="`/result/${lastResult.id}`" class="btn">Back to the last result</NuxtLink>
        <NuxtLink v-else to="/style" class="btn">Back to styles</NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.generate {
  padding-top: var(--space-10);
}

.failed {
  display: grid;
  gap: var(--space-3);
  max-width: 520px;
  margin-inline: auto;
  padding: var(--space-8) var(--space-6);
}

.failed__title {
  font-size: 2rem;
}

.failed__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
</style>
