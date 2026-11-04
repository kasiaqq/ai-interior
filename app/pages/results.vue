<script setup lang="ts">
import { STYLES } from '#shared/catalog'
import type { SessionResult } from '~/stores/session'
import { useSessionStore } from '~/stores/session'
import { relativeTime } from '~/utils/relative-time'

const COUNT_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

useHead({ title: 'All results' })

const session = useSessionStore()
const generation = useGeneration()

const now = ref(Date.now())
const clock = setInterval(() => (now.value = Date.now()), 30_000)
onUnmounted(() => clearInterval(clock))

const count = computed(() => session.results.length)
const heading = computed(
  () => `${COUNT_WORDS[count.value] ?? count.value} ${count.value === 1 ? 'take' : 'takes'} on the same room`,
)
const lastStyle = computed(() => session.results.at(-1)?.style)

const nameOf = (result: SessionResult) => `${STYLES[result.style].label} · variant ${session.variantNumber(result.id)}`
const downloadNameOf = (result: SessionResult) =>
  `ai-interior-${result.style}-v${session.variantNumber(result.id)}.jpg`

const compared = computed(() =>
  session.compareIds.map((id) => session.resultById(id)).filter((r): r is SessionResult => !!r),
)

function clearComparison() {
  for (const id of [...session.compareIds]) session.toggleCompare(id)
}

function newVariant() {
  if (!lastStyle.value) return
  session.setStyle(lastStyle.value)
  generation.start()
  navigateTo('/generate')
}
</script>

<template>
  <div class="container results">
    <div class="results__intro">
      <div>
        <h1 class="title">{{ heading }}</h1>
        <p class="lead results__lead">
          One photo, {{ count }} {{ count === 1 ? 'result' : 'results' }}. Pick two to compare side by side.
        </p>
      </div>
      <p class="warning results__warning">
        <AppIcon name="alert" :size="14" /> Closing this tab deletes everything. Download what you want to keep.
      </p>
    </div>

    <ComparePanel
      v-if="compared.length === 2 && session.photo"
      :items="compared.map((r) => ({ name: nameOf(r), url: r.url }))"
      :aspect-ratio="`${session.photo.width} / ${session.photo.height}`"
      @clear="clearComparison"
    />

    <section>
      <h2 class="eyebrow results__heading">All results in this session</h2>
      <div class="results__grid">
        <ResultCard
          v-for="result in session.results"
          :id="result.id"
          :key="result.id"
          :image-url="result.url"
          :name="nameOf(result)"
          :time="relativeTime(result.createdAt, now)"
          :download-name="downloadNameOf(result)"
          :compared="session.compareIds.includes(result.id)"
          :compare-disabled="session.compareIds.length >= 2 && !session.compareIds.includes(result.id)"
          @toggle-compare="session.toggleCompare(result.id)"
        />
      </div>
    </section>

    <div class="results__actions">
      <NuxtLink to="/style" class="btn btn--primary">Generate another style</NuxtLink>
      <button v-if="lastStyle" type="button" class="btn" @click="newVariant">
        New variant of {{ STYLES[lastStyle].label }}
      </button>
      <p class="results__limits">Up to 10 generations every 10 minutes while this tab is open.</p>
    </div>
  </div>
</template>

<style scoped>
.results {
  display: grid;
  gap: var(--space-6);
}

.results__intro {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.results__lead {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
}

.results__warning {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
}

.results__heading {
  margin-bottom: var(--space-3);
}

.results__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.results__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.results__limits {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .results__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
