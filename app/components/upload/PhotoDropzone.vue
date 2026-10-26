<script setup lang="ts">
defineProps<{ error?: string }>()
const emit = defineEmits<{ browse: []; file: [file: File] }>()

const dragging = ref(false)
function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) emit('file', file)
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ 'dropzone--active': dragging }"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <AppIcon name="upload" :size="28" class="dropzone__icon" />
    <p class="dropzone__title">Drag a photo here</p>
    <p class="dropzone__hint">JPG, PNG or WebP · up to 20 MB · one room per photo</p>
    <button type="button" class="btn btn--primary" @click="emit('browse')">Browse files</button>
    <p v-if="error" class="dropzone__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.dropzone {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-10) var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: center;
}

.dropzone--active {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.dropzone__icon {
  color: var(--color-accent-text);
  margin-bottom: var(--space-2);
}

.dropzone__title {
  font-weight: 600;
}

.dropzone__hint {
  margin-bottom: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.dropzone__error {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-warning-text);
}
</style>
