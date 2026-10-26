<script setup lang="ts">
import type { ChangeDescription } from '#shared/types'

const props = defineProps<{
  title: string
  context: string
  description: ChangeDescription | null
  copyText: string | null
  downloadUrl: string
  downloadName: string
}>()

const copied = ref(false)
async function copy() {
  if (!props.copyText) return
  await navigator.clipboard.writeText(props.copyText)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <section class="panel card">
    <h1 class="title panel__title">{{ title }}</h1>
    <p class="panel__context">{{ context }}</p>

    <template v-if="description">
      <div class="panel__section">
        <p class="eyebrow">Palette</p>
        <ul class="palette">
          <li v-for="colour in description.palette" :key="colour.role + colour.hex">
            <span class="palette__swatch" :style="{ background: colour.hex }" />
            <span class="palette__role">{{ colour.role }}</span>
          </li>
        </ul>
      </div>

      <div class="panel__section wide-only">
        <p class="eyebrow">Key pieces</p>
        <ul class="bullets">
          <li v-for="piece in description.keyPieces" :key="piece">{{ piece }}</li>
        </ul>
      </div>
      <div class="panel__section wide-only">
        <p class="eyebrow">Changed from your photo</p>
        <ul class="bullets">
          <li v-for="change in description.changes" :key="change">{{ change }}</li>
        </ul>
      </div>
      <div class="panel__section narrow-only">
        <p class="eyebrow">What changed</p>
        <p class="panel__summary">{{ description.summary }}</p>
      </div>

      <div v-if="description.kept.length" class="note panel__kept">
        <AppIcon name="lock" :size="14" />
        <div>
          <p class="eyebrow panel__kept-title wide-only">Kept exactly as it was</p>
          <p>{{ description.kept.join(' · ') }}</p>
        </div>
      </div>
    </template>
    <p v-else class="panel__unavailable">Details unavailable for this result — the image is all there.</p>

    <div class="panel__footer">
      <div class="panel__actions">
        <button v-if="copyText" type="button" class="btn" @click="copy">
          <AppIcon name="copy" :size="14" /> {{ copied ? 'Copied' : 'Copy details' }}
        </button>
        <a :href="downloadUrl" :download="downloadName" class="btn btn--primary">
          <AppIcon name="download" :size="14" /> Download<span class="wide-text">&nbsp;image</span>
        </a>
      </div>
      <slot name="links" />
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.panel__title {
  font-size: 2rem;
}

.panel__context {
  margin-top: calc(-1 * var(--space-3));
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.panel__section {
  display: grid;
  gap: var(--space-2);
}

.palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.palette__swatch {
  display: block;
  height: 32px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: var(--radius-sm);
}

.palette__role {
  display: block;
  margin-top: var(--space-1);
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.panel__summary {
  font-size: var(--text-md);
}

.panel__kept-title {
  color: var(--color-accent-text);
  margin-bottom: var(--space-1);
}

.panel__unavailable {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.panel__actions > :only-child {
  grid-column: span 2;
}

.panel__footer {
  display: grid;
  gap: var(--space-3);
}

.narrow-only {
  display: grid;
}

.wide-text {
  display: none;
}

.wide-only {
  display: none;
}

@media (max-width: 767px) {
  .palette__role {
    display: none;
  }

  .panel__footer {
    position: sticky;
    bottom: 0;
    margin: 0 calc(-1 * var(--space-5)) calc(-1 * var(--space-5));
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }
}

@media (min-width: 768px) {
  .narrow-only {
    display: none;
  }

  .wide-only {
    display: grid;
  }

  .wide-text {
    display: inline;
  }
}
</style>
