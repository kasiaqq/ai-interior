<script setup lang="ts">
import { PROBLEMS } from '#shared/catalog'
import type { ProblemId } from '#shared/types'

const props = defineProps<{ open: boolean; showHint: boolean }>()
const emit = defineEmits<{ cancel: []; retry: [problem: ProblemId]; uploadAnother: [] }>()

const problems = Object.entries(PROBLEMS) as [ProblemId, { label: string }][]
const problem = ref<ProblemId>('window')
const dialog = ref<HTMLDialogElement>()

watch(
  () => props.open,
  (open) => (open ? dialog.value?.showModal() : dialog.value?.close()),
)
</script>

<template>
  <dialog ref="dialog" class="dialog card" aria-labelledby="report-title" @cancel.prevent="emit('cancel')">
    <h2 id="report-title" class="title dialog__title">What’s off in this one?</h2>
    <p class="lead dialog__lead">Tell us what moved and we’ll run it again on the same photo.</p>

    <fieldset class="options">
      <legend class="eyebrow">Pick what’s wrong</legend>
      <label v-for="[id, item] in problems" :key="id" class="option" :class="{ 'option--selected': problem === id }">
        <input v-model="problem" type="radio" name="problem" :value="id" />
        {{ item.label }}
      </label>
    </fieldset>

    <p v-if="showHint" class="warning dialog__hint">
      This is the third try on this photo. It may be a hard one to read — a shot from further back, in daylight, usually
      fixes it.
    </p>

    <div class="dialog__actions">
      <button type="button" class="btn btn--ghost" @click="emit('cancel')">Cancel</button>
      <button v-if="showHint" type="button" class="btn" @click="emit('uploadAnother')">Upload another photo</button>
      <button type="button" class="btn btn--primary" @click="emit('retry', problem)">Try again</button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(400px, calc(100% - 2 * var(--gutter)));
  padding: var(--space-5);
  color: var(--color-text);
}

.dialog::backdrop {
  background: var(--color-overlay);
}

.dialog__title {
  font-size: 1.75rem;
}

.dialog__lead {
  margin: var(--space-1) 0 var(--space-4);
  font-size: var(--text-xs);
}

.options {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  border: 0;
}

.options legend {
  margin-bottom: var(--space-2);
}

.option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
}

.option input {
  accent-color: var(--color-accent);
}

.option--selected {
  background: var(--color-accent-soft);
}

.dialog__hint {
  margin-top: var(--space-4);
  font-size: var(--text-xs);
}

.dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>
