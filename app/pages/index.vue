<script setup lang="ts">
import { STYLES } from '#shared/catalog'
import { AppError, errorMessage } from '#shared/errors'
import type { PhotoAnalysis } from '#shared/types'
import { useSessionStore } from '~/stores/session'
import { checkPhoto } from '~/utils/api'
import { normalizePhoto } from '~/utils/normalize-photo'

const PASS: PhotoAnalysis = { verdict: 'ok', warnings: [], positives: [] }
const TIPS = [
  'Shoot from a corner, so two walls and the floor are visible',
  'Daylight, lights off — evening photos lose detail',
  'The whole room in frame, held straight — not a close-up of one wall',
  'No filters, no panorama, no people in the shot',
]

const session = useSessionStore()
const fileInput = ref<HTMLInputElement>()
const error = ref<string>()
const checking = ref(false)
const pendingFile = ref<File | null>(null)
let latestUpload = 0

const pickFile = () => fileInput.value?.click()

function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) receive(file)
}

function receive(file: File) {
  if (session.results.length) pendingFile.value = file
  else upload(file)
}

function confirmReplace() {
  const file = pendingFile.value
  pendingFile.value = null
  if (file) upload(file)
}

async function upload(file: File) {
  const upload = ++latestUpload
  error.value = undefined
  try {
    const photo = await normalizePhoto(file)
    if (upload !== latestUpload) return
    session.setPhoto({ ...photo, fileName: file.name, fileSize: file.size })
  } catch (e) {
    if (upload !== latestUpload) return
    error.value = errorMessage(e instanceof AppError ? e.code : 'INVALID_FILE')
    return
  }
  checking.value = true
  const analysis = await checkPhoto(session.photo!.blob).catch(() => PASS)
  if (upload !== latestUpload) return
  session.setAnalysis(analysis)
  if (analysis.verdict === 'ok') return navigateTo('/room')
  checking.value = false
}
</script>

<template>
  <div class="container">
    <input ref="fileInput" type="file" accept="image/*" class="visually-hidden" tabindex="-1" aria-hidden="true" @change="onFileChosen" />

    <template v-if="!session.photo">
      <h1 class="title hero__title">See your room in another style</h1>
      <p class="lead hero__lead">
        Upload one photo of a room you already have. We keep the walls, windows and doors exactly where they are, and
        change everything else — furniture, floor, colours, lighting.
      </p>

      <div class="upload">
        <div class="upload__main">
          <PhotoDropzone :error="error" @browse="pickFile" @file="receive" />
          <p class="privacy">
            <AppIcon name="lock" :size="14" />
            Your photo and results are deleted when you close this tab. Nothing is stored, no account needed.
          </p>
        </div>
        <aside class="tips card">
          <p class="eyebrow">Pick a good photo</p>
          <ul class="tips__list">
            <li v-for="tip in TIPS" :key="tip"><AppIcon name="check" :size="14" class="tips__check" /> {{ tip }}</li>
          </ul>
          <p class="tips__footer">Every room type works — kitchens and bathrooms included.</p>
        </aside>
      </div>

      <div class="styles">
        <span>Four styles, in their 2026 reading:</span>
        <span v-for="style in STYLES" :key="style.label" class="chip chip--static">{{ style.label }}</span>
      </div>
    </template>

    <div v-else class="checked">
      <PhotoPreview :photo="session.photo" @replace="pickFile">
        <p v-if="error" class="checked__error" role="alert">{{ error }}</p>
      </PhotoPreview>

      <div class="checked__side">
        <h1 class="title">{{ checking ? 'Checking your photo…' : 'We looked at your photo' }}</h1>
        <template v-if="!checking && session.analysis">
          <PhotoCheckPanel
            v-if="session.analysis.verdict === 'warning'"
            :warnings="session.analysis.warnings"
            @choose-another="pickFile"
            @continue="navigateTo('/room')"
          />
          <button v-else type="button" class="btn btn--primary checked__continue" @click="navigateTo('/room')">
            Continue to room type
          </button>
        </template>
        <p class="privacy privacy--ruled">
          <AppIcon name="lock" :size="14" />
          The photo stays in this session only. Close the tab and it is gone.
        </p>
      </div>
    </div>

    <ConfirmDialog
      :open="!!pendingFile"
      title="Use a new photo?"
      body="This starts a new session and clears every result for the current photo. Download what you want to keep first."
      confirm-label="Use new photo"
      @confirm="confirmReplace"
      @cancel="pendingFile = null"
    />
  </div>
</template>

<style scoped>
.hero__title {
  font-size: var(--text-display);
  margin-bottom: var(--space-3);
}

.hero__lead {
  max-width: 470px;
  margin-bottom: var(--space-8);
}

.upload {
  display: grid;
  gap: var(--space-5);
}

.upload__main {
  display: grid;
  gap: var(--space-3);
}

.privacy {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.privacy--ruled {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.tips {
  padding: var(--space-5);
}

.tips__list {
  display: grid;
  gap: var(--space-3);
  margin: var(--space-4) 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
}

.tips__list li {
  display: flex;
  gap: var(--space-2);
}

.tips__check {
  flex: none;
  margin-top: 3px;
  color: var(--color-accent-text);
}

.tips__footer {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.styles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-10);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.chip--static {
  min-height: 30px;
  color: var(--color-text);
  cursor: default;
}

.checked {
  display: grid;
  gap: var(--space-8);
}

.checked__side {
  display: grid;
  align-content: start;
  gap: var(--space-5);
}

.checked__continue {
  justify-self: start;
}

.checked__error {
  font-size: var(--text-sm);
  color: var(--color-warning-text);
}

@media (min-width: 768px) {
  .upload {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }

  .checked {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
