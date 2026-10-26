<script setup lang="ts">
import { ROOM_TYPES, STYLES } from '#shared/catalog'
import type { ProblemId, StyleId } from '#shared/types'
import { useSessionStore } from '~/stores/session'
import { formatDetails } from '~/utils/format-details'
import { relativeTime } from '~/utils/relative-time'

const session = useSessionStore()
const generation = useGeneration()
const route = useRoute()

const result = computed(() => session.resultById(String(route.params.id)))
const variant = computed(() => (result.value ? session.variantNumber(result.value.id) : 0))
const styleLabel = computed(() => (result.value ? STYLES[result.value.style].label : ''))
const roomLabel = computed(() => (result.value ? ROOM_TYPES[result.value.roomType].label : ''))
const otherStyles = computed(() => (Object.keys(STYLES) as StyleId[]).filter((id) => id !== result.value?.style))

const now = ref(Date.now())
const clock = setInterval(() => (now.value = Date.now()), 30_000)
onUnmounted(() => clearInterval(clock))

const copyText = computed(() =>
  result.value?.description
    ? formatDetails({
        styleLabel: styleLabel.value,
        variant: variant.value,
        roomLabel: roomLabel.value,
        description: result.value.description,
      })
    : null,
)

function generate(style: StyleId, problem?: ProblemId) {
  session.setStyle(style)
  generation.start({ problem })
  navigateTo('/generate')
}

const reporting = ref(false)
function retry(problem: ProblemId) {
  reporting.value = false
  session.registerReport()
  generate(result.value!.style, problem)
}
function uploadAnother() {
  reporting.value = false
  navigateTo('/')
}
</script>

<template>
  <div v-if="result && session.photo" class="container result">
    <div class="result__main">
      <BeforeAfterSlider
        :before-url="session.photo.url"
        :after-url="result.url"
        :after-label="`After · ${styleLabel}`"
        :width="session.photo.width"
        :height="session.photo.height"
      />
      <p class="result__drag narrow-only">Drag the handle to see the original</p>
      <div class="result__more">
        <span class="result__more-label wide-only">Same photo, another style:</span>
        <button v-for="id in otherStyles" :key="id" type="button" class="chip" @click="generate(id)">
          {{ STYLES[id].label }}
        </button>
        <button type="button" class="btn btn--accent-outline wide-only" @click="generate(result.style)">
          <AppIcon name="refresh" :size="14" /> Another {{ styleLabel }} variant
        </button>
      </div>
    </div>

    <ResultPanel
      :title="`${styleLabel} · variant ${variant}`"
      :context="`${roomLabel} · generated ${relativeTime(result.createdAt, now)}`"
      :description="result.description"
      :copy-text="copyText"
      :download-url="result.url"
      :download-name="`ai-interior-${result.style}-v${variant}.jpg`"
    >
      <template #links>
        <div class="result__links">
          <button type="button" class="link link--accent narrow-only" @click="generate(result.style)">
            Another variant
          </button>
          <button type="button" class="link result__report" @click="reporting = true">
            Something’s off<span class="wide-text">&nbsp;with this result</span>
          </button>
        </div>
      </template>
    </ResultPanel>

    <ReportProblemDialog
      :open="reporting"
      :show-hint="session.reportCount >= 2"
      @cancel="reporting = false"
      @retry="retry"
      @upload-another="uploadAnother"
    />
  </div>
</template>

<style scoped>
.result {
  display: grid;
  gap: var(--space-5);
}

.result__main {
  display: grid;
  gap: var(--space-3);
  align-content: start;
}

.result__drag {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.result__more {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.result__more-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.result__links {
  display: flex;
  justify-content: space-between;
}

.result__report {
  color: var(--color-text-muted);
}

.narrow-only {
  display: inline-flex;
}

.wide-text {
  display: none;
}

.wide-only {
  display: none;
}

@media (min-width: 768px) {
  .result {
    grid-template-columns: 5fr 3fr;
    align-items: start;
  }

  .result__links {
    justify-content: center;
  }

  .result__report {
    color: var(--color-accent-text);
  }

  .narrow-only {
    display: none;
  }

  .wide-only {
    display: inline-flex;
  }

  .wide-text {
    display: inline;
  }
}
</style>
