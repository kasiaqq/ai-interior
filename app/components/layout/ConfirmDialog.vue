<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string; body: string; confirmLabel: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const dialog = ref<HTMLDialogElement>()
const titleId = useId()
watch(
  () => props.open,
  (open) => (open ? dialog.value?.showModal() : dialog.value?.close()),
)
</script>

<template>
  <dialog ref="dialog" class="dialog card" :aria-labelledby="titleId" @cancel.prevent="emit('cancel')">
    <h2 :id="titleId" class="title dialog__title">{{ title }}</h2>
    <p class="lead">{{ body }}</p>
    <div class="dialog__actions">
      <button type="button" class="btn btn--ghost" @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn btn--primary" @click="emit('confirm')">{{ confirmLabel }}</button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(420px, calc(100% - 2 * var(--gutter)));
  padding: var(--space-6);
  color: var(--color-text);
}

.dialog::backdrop {
  background: var(--color-overlay);
}

.dialog__title {
  font-size: 1.75rem;
  margin-bottom: var(--space-2);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
